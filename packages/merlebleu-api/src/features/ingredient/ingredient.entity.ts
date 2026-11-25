import { Ingredient } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { IngredientUnitEntity } from './unit/ingredient-unit.entity';

export class IngredientEntity implements Ingredient {
  id: string;
  label: string;
  stock: number;
  unit: IngredientUnitEntity;
}

export const IngredientSchema = new EntitySchema<IngredientEntity>({
  name: 'IngredientEntity',
  tableName: 'ingredients',
  target: IngredientEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    label: { type: 'varchar' },
    stock: { type: 'decimal', precision: 10, scale: 2, default: 0 },
  },
  relations: {
    unit: {
      type: 'many-to-one',
      target: () => IngredientUnitEntity,
      joinColumn: { name: 'unitId', referencedColumnName: 'id' },
      eager: true,
    },
  },
});
