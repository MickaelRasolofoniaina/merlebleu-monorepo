import {
  INCOME_MOVEMENT_TYPES,
  MovementType,
  ReceiptPeriod,
  ReceiptPoint,
  ReceiptSummary,
  ReceiptWalletRow,
} from '@merlebleu/shared';
import { daysInMonth, DayRange } from './treasury.period';

export interface ReceiptMovementRow {
  date: string;
  type: MovementType;
  label: string;
  walletId: string | null;
  amount: number;
}

export interface ReceiptWallet {
  id: string;
  name: string;
  color: string;
  archived: boolean;
}

const MONTH_LABELS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const UNDEFINED_COLOR = '#94a3b8';

/**
 * Aggregates the movements of a period into receipts. Receipts are the deposits and
 * balances collected, minus the refunds. Transfers and opening balances are not receipts.
 */
export function buildReceiptSummary(
  period: ReceiptPeriod,
  range: DayRange,
  rows: ReceiptMovementRow[],
  wallets: ReceiptWallet[],
): ReceiptSummary {
  const walletRows = new Map<string | null, ReceiptWalletRow>();
  for (const wallet of wallets.filter((w) => !w.archived)) {
    walletRows.set(wallet.id, emptyRow(wallet.id, wallet.name, wallet.color));
  }

  let income = 0;
  let refunds = 0;
  let outflow = 0;

  for (const row of rows) {
    let wallet = walletRows.get(row.walletId);
    if (!wallet) {
      const known = wallets.find((w) => w.id === row.walletId);
      wallet = known
        ? emptyRow(known.id, known.name, known.color)
        : emptyRow(null, 'Non défini', UNDEFINED_COLOR);
      walletRows.set(row.walletId, wallet);
    }

    if (INCOME_MOVEMENT_TYPES.includes(row.type)) {
      income += row.amount;
      wallet.income += row.amount;
    } else if (row.type === MovementType.REFUND) {
      refunds -= row.amount;
      wallet.refunds -= row.amount;
    } else if (
      row.type === MovementType.EXPENSE ||
      row.type === MovementType.FIXED_EXPENSE
    ) {
      outflow -= row.amount;
      wallet.outflow -= row.amount;
    }
  }

  const walletList = [...walletRows.values()].map((row) => ({
    ...row,
    net: row.income - row.refunds - row.outflow,
  }));

  return {
    period,
    from: range.from,
    to: range.to,
    income,
    refunds,
    outflow,
    net: income - refunds - outflow,
    wallets: walletList,
    points: buildPoints(period, range, rows),
  };
}

function emptyRow(
  walletId: string | null,
  name: string,
  color: string,
): ReceiptWalletRow {
  return { walletId, name, color, income: 0, refunds: 0, outflow: 0, net: 0 };
}

function buildPoints(
  period: ReceiptPeriod,
  range: DayRange,
  rows: ReceiptMovementRow[],
): ReceiptPoint[] {
  if (period === ReceiptPeriod.DAY) {
    // one point per receipt: expenses are not receipts, so they are left out
    return rows.filter(isReceipt).map((row) => {
      const { income, refunds } = splitAmount(row);
      return {
        label: row.label,
        date: row.date,
        income,
        refunds,
        outflow: 0,
        amount: row.amount,
        net: row.amount,
      };
    });
  }

  const year = range.from.slice(0, 4);
  const bucketCount =
    period === ReceiptPeriod.MONTH
      ? daysInMonth(Number(year), Number(range.from.slice(5, 7)))
      : 12;
  const buckets = Array.from({ length: bucketCount }, () => ({
    income: 0,
    refunds: 0,
    outflow: 0,
  }));

  for (const row of rows) {
    const index =
      period === ReceiptPeriod.MONTH
        ? Number(row.date.slice(8, 10)) - 1
        : Number(row.date.slice(5, 7)) - 1;
    if (isReceipt(row)) {
      const { income, refunds } = splitAmount(row);
      buckets[index].income += income;
      buckets[index].refunds += refunds;
    } else if (isExpense(row)) {
      buckets[index].outflow -= row.amount;
    }
  }

  return buckets.map(({ income, refunds, outflow }, index) => ({
    label:
      period === ReceiptPeriod.MONTH ? String(index + 1) : MONTH_LABELS[index],
    date:
      period === ReceiptPeriod.MONTH
        ? `${range.from.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`
        : `${year}-${String(index + 1).padStart(2, '0')}-01`,
    income,
    refunds,
    outflow,
    amount: income - refunds,
    net: income - refunds - outflow,
  }));
}

const isReceipt = (row: ReceiptMovementRow): boolean =>
  INCOME_MOVEMENT_TYPES.includes(row.type) || row.type === MovementType.REFUND;

const isExpense = (row: ReceiptMovementRow): boolean =>
  row.type === MovementType.EXPENSE || row.type === MovementType.FIXED_EXPENSE;

/** Splits a receipt movement into income and refunds (a positive amount). */
function splitAmount(row: ReceiptMovementRow): {
  income: number;
  refunds: number;
} {
  const isRefund = row.type === MovementType.REFUND;
  return {
    income: isRefund ? 0 : row.amount,
    refunds: isRefund ? -row.amount : 0,
  };
}
