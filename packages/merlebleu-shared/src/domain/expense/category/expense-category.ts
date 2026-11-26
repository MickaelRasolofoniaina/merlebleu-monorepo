import { PaymentMethod } from "../../sale/payment/payment";

export enum ExpenseSection {
  CURRENT = "CURRENT",
  INGREDIENT = "INGREDIENT",
  OTHER = "OTHER",
}

export interface ExpenseCategory {
  id: string;
  label: string;
  /** Categories only belong to CURRENT or OTHER: the INGREDIENT section is fed by the ingredients table. */
  section: ExpenseSection.CURRENT | ExpenseSection.OTHER;
  /** Wallet used by default when a grid cell of this category is filled. */
  defaultPaymentMethod?: PaymentMethod | null;
}
