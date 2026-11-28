import { Ingredient, Recipe } from '@merlebleu/shared';
import { buildUsageRows, computeConsumption } from './production.calculations';

const unit = { id: 'u-g', label: 'g' };
const flour: Ingredient = { id: 'flour', label: 'farine', stock: 10000, unit };
const egg: Ingredient = { id: 'egg', label: 'oeufs', stock: 100, unit: { id: 'u-n', label: 'nombre' } };

const biscuit: Recipe = {
  id: 'r1',
  name: 'Biscuit nature',
  isActive: true,
  lines: [
    { id: 'l1', ingredient: flour, quantity: 1250 },
    { id: 'l2', ingredient: egg, quantity: 36 },
  ],
};
const cookie: Recipe = {
  id: 'r2',
  name: 'Cookie',
  isActive: true,
  lines: [{ id: 'l3', ingredient: flour, quantity: 1000 }],
};
const recipes = new Map([biscuit, cookie].map((recipe) => [recipe.id, recipe]));

describe('production calculations', () => {
  it('multiplies each dose by the number of batches', () => {
    const consumption = computeConsumption([{ recipeId: 'r1', quantity: 0.75 }], recipes);

    expect(consumption.get('flour')).toBe(937.5);
    expect(consumption.get('egg')).toBe(27);
  });

  it('adds up the same ingredient across recipes', () => {
    const consumption = computeConsumption(
      [
        { recipeId: 'r1', quantity: 3 },
        { recipeId: 'r2', quantity: 0.5 },
      ],
      recipes,
    );

    expect(consumption.get('flour')).toBe(4250);
  });

  it('ignores unknown recipes and empty quantities', () => {
    const consumption = computeConsumption(
      [
        { recipeId: 'missing', quantity: 2 },
        { recipeId: 'r1', quantity: 0 },
      ],
      recipes,
    );

    expect(consumption.size).toBe(0);
  });

  it('flags a negative remaining stock', () => {
    const rows = buildUsageRows(new Map([['egg', 144]]), new Map(), [flour, egg]);

    expect(rows.length).toBe(1);
    expect(rows[0].remaining).toBe(-44);
  });

  it('gives back what the saved productions of the day already consumed', () => {
    const rows = buildUsageRows(new Map([['egg', 108]]), new Map([['egg', 108]]), [flour, egg]);

    expect(rows[0].remaining).toBe(100);
  });
});
