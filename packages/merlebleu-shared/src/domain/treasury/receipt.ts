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
  /** Date of the point, YYYY-MM-DD. First day of the month for a yearly point. */
  date: string;
  /** Deposits and balances collected. */
  income: number;
  /** Refunds, as a positive amount. */
  refunds: number;
  /** Expenses paid, as a positive amount. Always 0 for a point of a day (one point per receipt). */
  outflow: number;
  /** Net receipts of the point (income minus refunds), shown by the chart. */
  amount: number;
  /** Full net of the point (income minus refunds minus expenses). */
  net: number;
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
