import { Ingredient } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import { IngredientUnitEntity } from './unit/ingredient-unit.entity';

export class IngredientEntity implements Ingredient {
  id: string;
  label: string;
  stock: number;
  unit: IngredientUnitEntity;
  entryUnit: IngredientUnitEntity | null;
  entryUnitFactor: number | null;
  defaultPaymentMethod: PaymentMethodEntity | null;
}

export const IngredientSchema = new EntitySchema<IngredientEntity>({
  name: 'IngredientEntity',
  tableName: 'ingredients',
  target: IngredientEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    label: { type: 'varchar' },
    stock: { type: 'decimal', precision: 10, scale: 2, default: 0 },
    // Stock units per entry unit (1 bag = 50000 g): decimal columns come back as strings, hence the transformer
    entryUnitFactor: {
      type: 'decimal',
      precision: 12,
      scale: 4,
      nullable: true,
      transformer: {
        to: (value: number | null) => value,
        from: (value: string | null) => (value === null ? null : Number(value)),
      },
    },
  },
  relations: {
    unit: {
      type: 'many-to-one',
      target: () => IngredientUnitEntity,
      joinColumn: { name: 'unitId', referencedColumnName: 'id' },
      eager: true,
    },
    entryUnit: {
      type: 'many-to-one',
      target: () => IngredientUnitEntity,
      joinColumn: { name: 'entryUnitId', referencedColumnName: 'id' },
      nullable: true,
      onDelete: 'SET NULL',
      eager: true,
    },
    defaultPaymentMethod: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: {
        name: 'defaultPaymentMethodId',
        referencedColumnName: 'id',
      },
      nullable: true,
      onDelete: 'SET NULL',
      eager: true,
    },
  },
});
