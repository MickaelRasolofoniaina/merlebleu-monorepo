import { PaymentMethod } from "../sale/payment/payment";
import { IngredientUnit } from "./unit/ingredient-unit";

export interface Ingredient {
  id: string;
  label: string;
  stock: number;
  unit: IngredientUnit;
  /** Wallet used by default when a grid cell of this ingredient is filled. */
  defaultPaymentMethod?: PaymentMethod | null;
}
