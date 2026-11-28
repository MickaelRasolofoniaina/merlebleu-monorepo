import { StockEntry } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { IngredientEntity } from '../ingredient.entity';

export class StockEntryEntity implements Omit<
  StockEntry,
  'ingredient' | 'entryDate'
> {
  id: string;
  entryDate: Date;
  quantity: number;
  enteredQuantity: number | null;
  enteredUnitLabel: string | null;
  conversionFactor: number | null;
  ingredient: IngredientEntity;
}

const nullableNumber = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

export const StockEntrySchema = new EntitySchema<StockEntryEntity>({
  name: 'StockEntryEntity',
  tableName: 'stock_entries',
  target: StockEntryEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    entryDate: { type: 'date' },
    quantity: { type: 'decimal', precision: 10, scale: 2 },
    // Null when the entry was typed in the stock unit (and for entries saved before the entry units existed)
    enteredQuantity: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
      transformer: nullableNumber,
    },
    enteredUnitLabel: { type: 'varchar', nullable: true },
    conversionFactor: {
      type: 'decimal',
      precision: 12,
      scale: 4,
      nullable: true,
      transformer: nullableNumber,
    },
  },
  relations: {
    ingredient: {
      type: 'many-to-one',
      target: () => IngredientEntity,
      joinColumn: { name: 'ingredientId', referencedColumnName: 'id' },
      eager: true,
    },
  },
});
