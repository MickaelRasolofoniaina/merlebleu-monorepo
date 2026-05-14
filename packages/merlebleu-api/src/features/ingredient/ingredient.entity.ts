import { Ingredient } from "@merlebleu/shared";
import { EntitySchema } from "typeorm";
import { IngredientCategoryEntity } from "./category/ingredient-category.entity";
import { IngredientUnitEntity } from "./unit/ingredient-unit.entity";

export class IngredientEntity implements Ingredient {
  id: string;
  label: string;
  unitPrice: number;
  category: IngredientCategoryEntity;
  unit: IngredientUnitEntity;
}

export const IngredientSchema = new EntitySchema<IngredientEntity>({
  name: "IngredientEntity",
  tableName: "ingredients",
  target: IngredientEntity,
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    label: { type: "varchar" },
    unitPrice: { type: "integer" },
  },
  relations: {
    category: {
      type: "many-to-one",
      target: () => IngredientCategoryEntity,
      joinColumn: { name: "categoryId", referencedColumnName: "id" },
      eager: true,
    },
    unit: {
      type: "many-to-one",
      target: () => IngredientUnitEntity,
      joinColumn: { name: "unitId", referencedColumnName: "id" },
      eager: true,
    },
  },
});
