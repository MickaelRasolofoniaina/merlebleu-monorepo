import { PaymentMethod } from "../sale/payment/payment";

export enum MovementType {
  OPENING = "OPENING",
  DEPOSIT = "DEPOSIT",
  BALANCE = "BALANCE",
  EXPENSE = "EXPENSE",
  FIXED_EXPENSE = "FIXED_EXPENSE",
  REFUND = "REFUND",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  /** Gap found when counting the cash at a closing. */
  ADJUSTMENT = "ADJUSTMENT",
}

/** Movement types that bring money in from a customer. */
export const INCOME_MOVEMENT_TYPES: MovementType[] = [
  MovementType.DEPOSIT,
  MovementType.BALANCE,
];

/** Movement types that take money out of the business. */
export const OUTFLOW_MOVEMENT_TYPES: MovementType[] = [
  MovementType.EXPENSE,
  MovementType.FIXED_EXPENSE,
];

/** One line of the treasury ledger. `amount` is signed: positive in, negative out. */
export interface Movement {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  type: MovementType;
  /** Customer name, expense label or transfer description. */
  label: string;
  /** Null for expenses with no wallet ("Non défini"). */
  wallet: Pick<PaymentMethod, "id" | "name" | "color"> | null;
  amount: number;
  orderId: string | null;
  expenseId: string | null;
  /** Wallet balance after this movement, only filled when a single wallet is filtered. */
  runningBalance: number | null;
}

export interface MovementTotals {
  income: number;
  outflow: number;
}

export interface MovementPage {
  data: Movement[];
  total: number;
  page: number;
  limit: number;
  totals: MovementTotals;
  /** YYYY-MM-DD, last closed day: older movements are locked and have no running balance. */
  lockedUntil: string | null;
}
