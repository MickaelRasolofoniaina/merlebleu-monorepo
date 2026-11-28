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
  ingredient: IngredientEntity;
}

export const StockEntrySchema = new EntitySchema<StockEntryEntity>({
  name: 'StockEntryEntity',
  tableName: 'stock_entries',
  target: StockEntryEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    entryDate: { type: 'date' },
    quantity: { type: 'decimal', precision: 10, scale: 2 },
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
