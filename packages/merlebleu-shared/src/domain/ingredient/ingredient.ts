import { IngredientUnit } from "./unit/ingredient-unit";

export interface Ingredient {
  id: string;
  label: string;
  stock: number;
  unit: IngredientUnit;
}
