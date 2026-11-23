import { z } from "zod";
import { ItemType } from "./item";

export const createItemSchema = z.object({
  label: z.string().min(1, "Veuillez remplir le nom de l'article"),
  unitPrice: z.number().positive("Le prix unitaire doit être positif"),
  type: z.enum(ItemType, "Le type de l'article doit être un type valide"),
});

export const updateItemSchema = createItemSchema;

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;