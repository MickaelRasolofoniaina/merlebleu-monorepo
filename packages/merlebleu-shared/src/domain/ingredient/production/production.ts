import { Ingredient } from "../ingredient";
import { Recipe } from "../recipe/recipe";

/** Quantity of an ingredient consumed by a production, frozen when the production is saved. */
export interface ProductionConsumption {
  id: string;
  ingredient: Ingredient;
  quantity: number;
}

export interface Production {
  id: string;
  /** Day of the production, formatted YYYY-MM-DD. */
  productionDate: string;
  recipe: Recipe;
  /** Number of batches produced. */
  quantity: number;
  consumptions: ProductionConsumption[];
}

export interface IngredientShortage {
  ingredient: Ingredient;
  stock: number;
}

export interface ProductionDayResult {
  productions: Production[];
  /** Ingredients whose stock is negative after saving the day. */
  shortages: IngredientShortage[];
}
