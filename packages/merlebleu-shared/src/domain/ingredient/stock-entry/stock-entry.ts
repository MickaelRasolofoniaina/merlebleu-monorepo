import { Ingredient } from "../ingredient";

export interface IngredientPurchase {
  id: string;
  purchaseDate: string;
  ingredient: Ingredient;
  quantity: number;
}
