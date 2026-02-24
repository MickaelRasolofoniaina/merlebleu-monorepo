import { Item, ItemType } from "@merlebleu/shared";
import { EntitySchema } from "typeorm";

export class ItemEntity implements Item {
  id: string;
  label: string;
  unitPrice: number;
  type: ItemType;
  maxRetentionDays: number;
}

export const ItemSchema = new EntitySchema<ItemEntity>({
  name: "ItemEntity",
  tableName: "items",
  target: ItemEntity,
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    label: {
      type: "varchar",
    },
    unitPrice: {
      type: "integer",
    },
    type: {
      type: "enum",
      enum: ItemType,
    },
    maxRetentionDays: {
      type: "int",
    },
  },
});