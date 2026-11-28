import { Recipe, RecipeLine } from '@merlebleu/shared';
import { EntitySchema, ValueTransformer } from 'typeorm';
import { IngredientEntity } from '../ingredient.entity';

/** Decimal columns come back as strings from PostgreSQL; expose them as numbers. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};

export class RecipeLineEntity implements RecipeLine {
  id: string;
  quantity: number;
  ingredient: IngredientEntity;
  recipe?: RecipeEntity;
}

export class RecipeEntity implements Recipe {
  id: string;
  name: string;
  isActive: boolean;
  lines: RecipeLineEntity[];
}

export const RecipeLineSchema = new EntitySchema<RecipeLineEntity>({
  name: 'RecipeLineEntity',
  tableName: 'recipe_lines',
  target: RecipeLineEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    quantity: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      transformer: decimalTransformer,
    },
  },
  relations: {
    recipe: {
      type: 'many-to-one',
      target: () => RecipeEntity,
      joinColumn: { name: 'recipeId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
    ingredient: {
      type: 'many-to-one',
      target: () => IngredientEntity,
      joinColumn: { name: 'ingredientId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
      eager: true,
    },
  },
});

export const RecipeSchema = new EntitySchema<RecipeEntity>({
  name: 'RecipeEntity',
  tableName: 'recipes',
  target: RecipeEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: 'varchar' },
    isActive: { type: 'boolean', default: true },
  },
  relations: {
    lines: {
      type: 'one-to-many',
      target: () => RecipeLineEntity,
      inverseSide: 'recipe',
      cascade: true,
      eager: true,
    },
  },
});
