export enum ReceiptPeriod {
  DAY = "DAY",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export interface ReceiptWalletRow {
  walletId: string | null;
  name: string;
  color: string;
  income: number;
  refunds: number;
  outflow: number;
  net: number;
}

export interface ReceiptPoint {
  label: string;
  /** Net receipts of the point (income minus refunds). */
  amount: number;
}

export interface ReceiptSummary {
  period: ReceiptPeriod;
  /** Inclusive start, YYYY-MM-DD */
  from: string;
  /** Inclusive end, YYYY-MM-DD */
  to: string;
  income: number;
  refunds: number;
  outflow: number;
  net: number;
  wallets: ReceiptWalletRow[];
  /** Per order for a day, per day for a month, per month for a year. */
  points: ReceiptPoint[];
}
