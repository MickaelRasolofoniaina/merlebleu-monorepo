/** One wallet frozen by a cash closing. */
export interface CashClosingLine {
  walletId: string;
  walletName: string;
  walletColor: string;
  /** Balance computed from the movements, at the closing date. */
  calculatedAmount: number;
  /** Amount physically counted, null when the wallet was not counted. */
  countedAmount: number | null;
  /** Balance kept from the closing on: the counted amount, else the calculated one. */
  frozenAmount: number;
  /** frozen - calculated, 0 when the wallet was not counted. */
  gap: number;
}

export interface CashClosing {
  id: string;
  /** YYYY-MM-DD, last day covered by the closing. */
  date: string;
  /** ISO datetime. */
  createdAt: string;
  createdBy: string;
  totalFrozen: number;
  totalGap: number;
  lines: CashClosingLine[];
  /** Only the latest closing can be reopened. */
  reopenable: boolean;
}

export interface ClosingPreviewWallet {
  walletId: string;
  walletName: string;
  walletColor: string;
  calculatedAmount: number;
}

/** What the admin sees before freezing the balances at `date`. */
export interface ClosingPreview {
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD, null when the cash was never closed. */
  lastClosingDate: string | null;
  wallets: ClosingPreviewWallet[];
  /** Expenses with no wallet, they are not part of any balance. */
  undefinedExpenseCount: number;
  undefinedExpenseAmount: number;
}
