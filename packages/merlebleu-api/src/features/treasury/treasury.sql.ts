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
 * Movements dated before the opening day of their wallet are ignored.
 * `ord` puts the opening line before the other lines of the same day.
 */
export const MOVEMENTS_CTE = `
WITH m AS (
  SELECT 'deposit:' || o.id AS id, o."orderDate"::text AS date, 'DEPOSIT' AS type,
    o."customerName"::text AS label, o."paymentMethodId" AS "walletId",
    (o."paidAmount" - o."balancePaidAmount") AS amount,
    o.id AS "orderId", NULL::uuid AS "expenseId", 1 AS ord
  FROM orders o
  WHERE o."paidAmount" - o."balancePaidAmount" > 0
  UNION ALL
  SELECT 'balance:' || o.id, COALESCE(o."balancePaidDate", o."deliveryDate")::text, 'BALANCE',
    o."customerName"::text, COALESCE(o."balancePaymentMethodId", o."paymentMethodId"),
    o."balancePaidAmount", o.id, NULL::uuid, 1
  FROM orders o
  WHERE o."orderStatus" = 'DELIVERED' AND o."balancePaidAmount" > 0
  UNION ALL
  SELECT 'expense:' || e.id, e.date::text,
    CASE WHEN e.nature = 'FIXED' THEN 'FIXED_EXPENSE' ELSE 'EXPENSE' END,
    COALESCE(e.label, i.label, c.label, '')::text,
    COALESCE(e."paymentMethodId", c."defaultPaymentMethodId", i."defaultPaymentMethodId"),
    -e.amount, NULL::uuid, e.id, 1
  FROM expenses e
  LEFT JOIN expense_categories c ON c.id = e."categoryId"
  LEFT JOIN ingredients i ON i.id = e."ingredientId"
  WHERE e.nature = 'VARIABLE' OR e.paid = true
  UNION ALL
  SELECT 'transfer-out:' || t.id, t.date::text, 'TRANSFER_OUT',
    ('Virement vers ' || w.name)::text, t."fromWalletId", -t.amount, NULL::uuid, NULL::uuid, 1
  FROM wallet_transfers t JOIN payment_methods w ON w.id = t."toWalletId"
  UNION ALL
  SELECT 'transfer-in:' || t.id, t.date::text, 'TRANSFER_IN',
    ('Virement depuis ' || w.name)::text, t."toWalletId", t.amount, NULL::uuid, NULL::uuid, 1
  FROM wallet_transfers t JOIN payment_methods w ON w.id = t."fromWalletId"
  UNION ALL
  SELECT 'refund:' || r.id, r.date::text, 'REFUND', o."customerName"::text, r."walletId",
    -r.amount, r."orderId", NULL::uuid, 1
  FROM order_refunds r JOIN orders o ON o.id = r."orderId"
  UNION ALL
  SELECT 'opening:' || p.id, p."openingDate"::text, 'OPENING', 'Ouverture du portefeuille'::text,
    p.id, p."openingBalance", NULL::uuid, NULL::uuid, 0
  FROM payment_methods p
  WHERE p."openingDate" IS NOT NULL AND p."openingBalance" <> 0
),
f AS (
  SELECT m.*, w.name AS "walletName", w.color AS "walletColor",
    SUM(m.amount) OVER (PARTITION BY m."walletId" ORDER BY m.date, m.ord, m.id) AS running
  FROM m
  LEFT JOIN payment_methods w ON w.id = m."walletId"
  WHERE w.id IS NULL OR w."openingDate" IS NULL OR m.date >= w."openingDate"::text
)
`;

export const INCOME_TYPES_SQL = `('DEPOSIT','BALANCE')`;
export const OUTFLOW_TYPES_SQL = `('EXPENSE','FIXED_EXPENSE','REFUND')`;
