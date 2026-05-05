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