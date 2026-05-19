import { IngredientCategory } from "./category/ingredient-category";
import { IngredientUnit } from "./unit/ingredient-unit";

export interface Ingredient {
  id: string;
  label: string;
  unitPrice: number;
  stock: number;
  category: IngredientCategory;
  unit: IngredientUnit;
}
