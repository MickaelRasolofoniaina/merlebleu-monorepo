import { IngredientCategory } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';

export class IngredientCategoryEntity implements IngredientCategory {
  id: string;
  label: string;
}

export const IngredientCategorySchema =
  new EntitySchema<IngredientCategoryEntity>({
    name: 'IngredientCategoryEntity',
    tableName: 'ingredient_categories',
    target: IngredientCategoryEntity,
    columns: {
      id: {
        type: 'uuid',
        primary: true,
        generated: 'uuid',
      },
      label: {
        type: 'varchar',
      },
    },
  });
