import { IngredientPurchase } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { IngredientEntity } from '../ingredient.entity';

export class IngredientPurchaseEntity implements Omit<
  IngredientPurchase,
  'ingredient' | 'purchaseDate'
> {
  id: string;
  purchaseDate: Date;
  quantity: number;
  ingredient: IngredientEntity;
}

export const IngredientPurchaseSchema =
  new EntitySchema<IngredientPurchaseEntity>({
    name: 'IngredientPurchaseEntity',
    tableName: 'ingredient_purchases',
    target: IngredientPurchaseEntity,
    columns: {
      id: { type: 'uuid', primary: true, generated: 'uuid' },
      purchaseDate: { type: 'date' },
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
