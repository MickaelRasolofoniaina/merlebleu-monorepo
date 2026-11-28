import { Production, ProductionConsumption } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { IngredientEntity } from '../ingredient.entity';
import { RecipeEntity, decimalTransformer } from '../recipe/recipe.entity';

export class ProductionConsumptionEntity implements ProductionConsumption {
  id: string;
  quantity: number;
  ingredient: IngredientEntity;
  production?: ProductionEntity;
}

export class ProductionEntity implements Production {
  id: string;
  productionDate: string;
  quantity: number;
  recipe: RecipeEntity;
  consumptions: ProductionConsumptionEntity[];
}

export const ProductionConsumptionSchema =
  new EntitySchema<ProductionConsumptionEntity>({
    name: 'ProductionConsumptionEntity',
    tableName: 'production_consumptions',
    target: ProductionConsumptionEntity,
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
      production: {
        type: 'many-to-one',
        target: () => ProductionEntity,
        joinColumn: { name: 'productionId', referencedColumnName: 'id' },
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

export const ProductionSchema = new EntitySchema<ProductionEntity>({
  name: 'ProductionEntity',
  tableName: 'productions',
  target: ProductionEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    productionDate: { type: 'date' },
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
      onDelete: 'RESTRICT',
      eager: true,
    },
    consumptions: {
      type: 'one-to-many',
      target: () => ProductionConsumptionEntity,
      inverseSide: 'production',
      cascade: true,
      eager: true,
    },
  },
  uniques: [
    {
      name: 'UQ_productions_date_recipe',
      columns: ['productionDate', 'recipe'],
    },
  ],
});
