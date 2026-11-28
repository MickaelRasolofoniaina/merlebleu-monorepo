import { Ingredient } from "../ingredient";

export interface StockEntry {
  id: string;
  entryDate: string;
  ingredient: Ingredient;
  quantity: number;
}
