import { Ingredient } from "../ingredient";

export interface RecipeLine {
  id: string;
  ingredient: Ingredient;
  /** Dose for one batch, expressed in the unit of the ingredient stock. */
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  isActive: boolean;
  lines: RecipeLine[];
}
