# Shared Library Conventions

## Validation with Zod

Both Angular and NestJS use Zod for object validation.

### Code organization

For each entity, three layers must be created:

1. **`merlebleu-shared`** — interface + Zod DTOs (shared between API and App)
2. **`merlebleu-api`** — TypeORM entity implementing the interface

---

## 1. Interface in `merlebleu-shared`

Create the interface representing the entity along with any associated enums in `src/domain/{domain}/{entity}/{entity}.ts`.

```ts
// packages/merlebleu-shared/src/domain/inventory/item/item.ts
export enum ItemType {
  PASTRY = "VIENNOISERIE",
  CAKE = "PATISSERIE",
  DRINK = "BOISSON",
}

export interface Item {
  id: string;
  label: string;
  unitPrice: number;
  type: ItemType;
  maxRetentionDays: number;
}
```

---

## 2. Zod DTOs in `merlebleu-shared`

Create Zod validation schemas and derive types from them in `src/domain/{domain}/{entity}/{entity}.dto.ts`.

```ts
// packages/merlebleu-shared/src/domain/inventory/item/item.dto.ts
import { z } from "zod";
import { ItemType } from "./item";

export const createItemSchema = z.object({
  label: z.string().min(1, "Veuillez remplir le nom de l'article"),
  unitPrice: z.number().positive("Le prix unitaire doit être positif"),
  type: z.enum(ItemType, "Le type de l'article doit être un type valide"),
  maxRetentionDays: z.number()
    .int("Le nombre de jours de conservation doit être un entier")
    .positive("Le nombre de jours de conservation doit être positif")
    .min(1, "Le nombre de jours de conservation doit être au moins 1"),
});

export const updateItemSchema = createItemSchema;

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
```

---

## 3. TypeORM entity in `merlebleu-api`

Create a class that implements the shared interface and define the TypeORM `EntitySchema` in `src/features/{domain}/{entity}/{entity}.entity.ts`.

```ts
// packages/merlebleu-api/src/features/inventory/item/item.entity.ts
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
```

---

## 4. NestJS DTO in `merlebleu-api`

Extend the shared Zod schemas via `nestjs-zod` in `src/features/{domain}/{entity}/{entity}.dto.ts`.

```ts
// packages/merlebleu-api/src/features/inventory/item/item.dto.ts
import { createItemSchema, updateItemSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateItemDto extends createZodDto(createItemSchema) {}

export class UpdateItemDto extends createZodDto(updateItemSchema) {}
```
