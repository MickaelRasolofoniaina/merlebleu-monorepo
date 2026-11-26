/**
 * The treasury ledger is a computed view over existing data, nothing is duplicated:
 * - DEPOSIT: what the customer paid when the order was taken, dated `orderDate`
 *   (kept even when the order is cancelled, a refund is a separate movement);
 * - BALANCE: what was collected at delivery, dated `balancePaidDate`
 *   (or `deliveryDate` for orders delivered before that column existed);
 * - EXPENSE / FIXED_EXPENSE: variable expenses, and fixed ones only once paid;
 *   an expense with no wallet falls back to the default wallet of its category or ingredient;
 * - REFUND, TRANSFER_IN / TRANSFER_OUT and OPENING come from the treasury tables.
 *
 * Cash closings cut the ledger in two (see `cash_closings`):
 * - the "open" part, after the latest closing, is the only one read to compute balances:
 *   it starts from the frozen balance of each wallet (an OPENING line) so its cost does not
 *   grow with the age of the data;
 * - the "history" part, up to the latest closing, only feeds the lists (movements, export,
 *   receipts). It has no running balance and includes the ADJUSTMENT lines, the counting gaps
 *   that are already part of the frozen balances (so they are never summed in the open part).
 *
 * Movements dated before the opening day of their wallet are ignored.
 * `ord` puts the opening line before the other lines of the same day.
 */
export const LAST_CLOSING_SQL = `COALESCE((SELECT MAX(date) FROM cash_closings), DATE '0001-01-01')`;

type Scope = 'open' | 'history';

/** `since` is a SQL date expression (e.g. `$1::date`): older movements are left out. */
function movements(scope: Scope, since?: string): string {
  const sinceFilter = (column: string): string =>
    since ? ` AND ${column} >= ${since}` : '';
  const inScope = (column: string): string =>
    (scope === 'open'
      ? `${column} > ${LAST_CLOSING_SQL}`
      : `${column} <= ${LAST_CLOSING_SQL}`) + sinceFilter(column);

  const closingLines =
    scope === 'open'
      ? `
  SELECT 'closing:' || l.id, c.date::text, 'OPENING',
    ('Solde figé au ' || to_char(c.date, 'DD/MM/YYYY'))::text,
    l."walletId", l."frozenAmount", NULL::uuid, NULL::uuid, 0
  FROM cash_closing_lines l JOIN cash_closings c ON c.id = l."closingId"
  WHERE c.date = ${LAST_CLOSING_SQL} AND l."frozenAmount" <> 0${sinceFilter('c.date')}`
      : `
  SELECT 'adjustment:' || l.id, c.date::text, 'ADJUSTMENT', 'Écart de comptage (clôture)'::text,
    l."walletId", l."frozenAmount" - l."calculatedAmount", NULL::uuid, NULL::uuid, 2
  FROM cash_closing_lines l JOIN cash_closings c ON c.id = l."closingId"
  WHERE l."frozenAmount" <> l."calculatedAmount"${sinceFilter('c.date')}`;

  return `
  SELECT 'deposit:' || o.id AS id, o."orderDate"::text AS date, 'DEPOSIT' AS type,
    o."customerName"::text AS label, o."paymentMethodId" AS "walletId",
    (o."paidAmount" - o."balancePaidAmount") AS amount,
    o.id AS "orderId", NULL::uuid AS "expenseId", 1 AS ord
  FROM orders o
  WHERE o."paidAmount" - o."balancePaidAmount" > 0 AND ${inScope('o."orderDate"')}
  UNION ALL
  SELECT 'balance:' || o.id, COALESCE(o."balancePaidDate", o."deliveryDate")::text, 'BALANCE',
    o."customerName"::text, COALESCE(o."balancePaymentMethodId", o."paymentMethodId"),
    o."balancePaidAmount", o.id, NULL::uuid, 1
  FROM orders o
  WHERE o."orderStatus" = 'DELIVERED' AND o."balancePaidAmount" > 0
    AND ${inScope('COALESCE(o."balancePaidDate", o."deliveryDate")')}
  UNION ALL
  SELECT 'expense:' || e.id, e.date::text,
    CASE WHEN e.nature = 'FIXED' THEN 'FIXED_EXPENSE' ELSE 'EXPENSE' END,
    COALESCE(e.label, i.label, c.label, '')::text,
    COALESCE(e."paymentMethodId", c."defaultPaymentMethodId", i."defaultPaymentMethodId"),
    -e.amount, NULL::uuid, e.id, 1
  FROM expenses e
  LEFT JOIN expense_categories c ON c.id = e."categoryId"
  LEFT JOIN ingredients i ON i.id = e."ingredientId"
  WHERE (e.nature = 'VARIABLE' OR e.paid = true) AND ${inScope('e.date')}
  UNION ALL
  SELECT 'transfer-out:' || t.id, t.date::text, 'TRANSFER_OUT',
    ('Virement vers ' || w.name)::text, t."fromWalletId", -t.amount, NULL::uuid, NULL::uuid, 1
  FROM wallet_transfers t JOIN payment_methods w ON w.id = t."toWalletId"
  WHERE ${inScope('t.date')}
  UNION ALL
  SELECT 'transfer-in:' || t.id, t.date::text, 'TRANSFER_IN',
    ('Virement depuis ' || w.name)::text, t."toWalletId", t.amount, NULL::uuid, NULL::uuid, 1
  FROM wallet_transfers t JOIN payment_methods w ON w.id = t."fromWalletId"
  WHERE ${inScope('t.date')}
  UNION ALL
  SELECT 'refund:' || r.id, r.date::text, 'REFUND', o."customerName"::text, r."walletId",
    -r.amount, r."orderId", NULL::uuid, 1
  FROM order_refunds r JOIN orders o ON o.id = r."orderId"
  WHERE ${inScope('r.date')}
  UNION ALL
  SELECT 'opening:' || p.id, p."openingDate"::text, 'OPENING', 'Ouverture du portefeuille'::text,
    p.id, p."openingBalance", NULL::uuid, NULL::uuid, 0
  FROM payment_methods p
  WHERE p."openingDate" IS NOT NULL AND p."openingBalance" <> 0 AND ${inScope('p."openingDate"')}
  UNION ALL${closingLines}`;
}

const withWallet = (source: string, running: string): string => `
  SELECT ${source}.*, w.name AS "walletName", w.color AS "walletColor", ${running} AS running
  FROM ${source}
  LEFT JOIN payment_methods w ON w.id = ${source}."walletId"
  WHERE w.id IS NULL OR w."openingDate" IS NULL OR ${source}.date >= w."openingDate"::text`;

const RUNNING_SQL = `SUM(m.amount) OVER (PARTITION BY m."walletId" ORDER BY m.date, m.ord, m.id)`;

/** Ledger after the latest closing, with the running balance of each wallet. Used for balances. */
export const MOVEMENTS_CTE = `
WITH m AS (${movements('open')}
),
f AS (${withWallet('m', RUNNING_SQL)}
)
`;

/**
 * The whole ledger: the open part with its running balance, plus the closed history without one.
 * Reads every movement, so only the lists and reports use it, never the balances.
 */
export const MOVEMENTS_WITH_HISTORY_CTE = `
WITH m AS (${movements('open')}
),
fo AS (${withWallet('m', RUNNING_SQL)}
),
mh AS (${movements('history')}
),
fh AS (${withWallet('mh', 'NULL::bigint')}
),
f AS (SELECT * FROM fo UNION ALL SELECT * FROM fh)
`;

/**
 * The movements dated from `$1` on (a YYYY-MM-DD parameter), whatever side of a closing they
 * are on, with no running balance. Reads only that window, so it stays cheap for the current
 * month and for receipts, however old the data is.
 */
export const MOVEMENTS_SINCE_CTE = `
WITH mo AS (${movements('open', '$1::date')}
),
mh AS (${movements('history', '$1::date')}
),
m AS (SELECT * FROM mo UNION ALL SELECT * FROM mh),
f AS (${withWallet('m', 'NULL::bigint')}
)
`;

export const INCOME_TYPES_SQL = `('DEPOSIT','BALANCE')`;
export const OUTFLOW_TYPES_SQL = `('EXPENSE','FIXED_EXPENSE','REFUND')`;
