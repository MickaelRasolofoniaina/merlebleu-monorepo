import { PaymentMethod } from "../sale/payment/payment";
import { IngredientUnit } from "./unit/ingredient-unit";

export interface Ingredient {
  id: string;
  label: string;
  stock: number;
  /** Unit of the recipes and of the stock. */
  unit: IngredientUnit;
  /** Unit in which the goods are received (e.g. a bag). Null when entries are typed in the stock unit. */
  entryUnit?: IngredientUnit | null;
  /** Number of stock units in one entry unit (e.g. 50000 when 1 bag = 50000 g). */
  entryUnitFactor?: number | null;
  /** Wallet used by default when a grid cell of this ingredient is filled. */
  defaultPaymentMethod?: PaymentMethod | null;
}
