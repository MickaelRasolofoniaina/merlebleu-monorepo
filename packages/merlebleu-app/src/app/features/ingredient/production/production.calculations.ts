import { Ingredient, Recipe } from '@merlebleu/shared';

export interface ProductionLine {
  recipeId: string;
  quantity: number;
}

export interface UsageRow {
  ingredient: Ingredient;
  consumed: number;
  remaining: number;
}

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Quantity of each ingredient consumed by the given lines (dose x number of batches). */
export const computeConsumption = (
  lines: ProductionLine[],
  recipes: Map<string, Recipe>,
): Map<string, number> => {
  const consumption = new Map<string, number>();
  for (const line of lines) {
    const recipe = recipes.get(line.recipeId);
    if (!recipe || !(line.quantity > 0)) continue;
    for (const recipeLine of recipe.lines) {
      const id = recipeLine.ingredient.id;
      consumption.set(
        id,
        round((consumption.get(id) ?? 0) + Number(recipeLine.quantity) * line.quantity),
      );
    }
  }
  return consumption;
};

/**
 * Preview of the stock left once the day is saved. The stock already includes
 * what the saved productions of the day consumed, so it is given back first.
 */
export const buildUsageRows = (
  consumption: Map<string, number>,
  savedConsumption: Map<string, number>,
  ingredients: Ingredient[],
): UsageRow[] =>
  ingredients
    .filter((ingredient) => consumption.has(ingredient.id))
    .map((ingredient) => {
      const consumed = consumption.get(ingredient.id) ?? 0;
      const given = savedConsumption.get(ingredient.id) ?? 0;
      return {
        ingredient,
        consumed,
        remaining: round(Number(ingredient.stock) + given - consumed),
      };
    });
