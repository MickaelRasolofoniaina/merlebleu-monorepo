import { IngredientUnit } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';

export class IngredientUnitEntity implements IngredientUnit {
  id: string;
  label: string;
}

export const IngredientUnitSchema = new EntitySchema<IngredientUnitEntity>({
  name: 'IngredientUnitEntity',
  tableName: 'ingredient_units',
  target: IngredientUnitEntity,
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
