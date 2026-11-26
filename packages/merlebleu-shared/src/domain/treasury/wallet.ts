import { PaymentMethod } from "../sale/payment/payment";

export interface WalletCashCount {
  /** YYYY-MM-DD */
  date: string;
  countedAmount: number;
  expectedAmount: number;
  /** counted - expected */
  gap: number;
}

export interface Wallet extends PaymentMethod {
  id: string;
  openingBalance: number;
  openingDate: string | null;
  archived: boolean;
  balance: number;
  /** Income received in the current month (deposits and balances). */
  monthIncome: number;
  /** Outflows of the current month (expenses and refunds). */
  monthOutflow: number;
  lastCashCount: WalletCashCount | null;
  /** Balance frozen by the latest closing, null when there is none for this wallet. */
  frozenAmount: number | null;
}

export interface WalletSummary {
  wallets: Wallet[];
  /** Sum of the balances of the active wallets. */
  totalBalance: number;
  /** Sum of the movements that have no wallet (expenses without a payment method). */
  undefinedBalance: number;
  /** YYYY-MM-DD, date of the latest cash closing, null when the cash was never closed. */
  lastClosingDate: string | null;
}

export interface CashCount {
  id: string;
  walletId: string;
  date: string;
  countedAmount: number;
  expectedAmount: number;
  gap: number;
  note: string | null;
}
