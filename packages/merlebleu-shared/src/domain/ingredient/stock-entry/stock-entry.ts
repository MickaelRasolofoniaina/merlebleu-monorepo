import { Ingredient } from "../ingredient";

export interface StockEntry {
  id: string;
  entryDate: string;
  ingredient: Ingredient;
  /** Quantity added to the stock, always expressed in the stock unit of the ingredient. */
  quantity: number;
  /** Quantity typed by the user, in the entry unit. Null when typed in the stock unit. */
  enteredQuantity?: number | null;
  /** Label of the entry unit used when the entry was saved (kept if the unit is renamed later). */
  enteredUnitLabel?: string | null;
  /** Stock units per entry unit at the time of the entry. */
  conversionFactor?: number | null;
}
