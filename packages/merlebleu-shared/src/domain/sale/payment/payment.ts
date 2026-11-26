export const DEFAULT_PAYMENT_METHOD_COLOR = "#7c3aed";

export interface PaymentMethod {
  id?: string;
  name: string;
  color: string;
  /** Balance of the wallet at `openingDate`. Defaults to 0. */
  openingBalance?: number;
  /** YYYY-MM-DD. Movements before this day are ignored; null counts every movement. */
  openingDate?: string | null;
  /** An archived wallet is hidden from the pickers but its history stays readable. */
  archived?: boolean;
}
