import { Ingredient } from "../ingredient";

export interface IngredientMonthSummary {
  ingredient: Ingredient;
  /** Sum of the purchases of the month. */
  entries: number;
  /** Sum of the quantities consumed by the productions of the month. */
  consumed: number;
  /** Stock as of today, not the stock at the end of the month. */
  currentStock: number;
}
