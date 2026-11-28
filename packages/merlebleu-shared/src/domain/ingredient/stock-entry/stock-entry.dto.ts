import { z } from "zod";

export const createIngredientPurchaseSchema = z.object({
  purchaseDate: z.preprocess(
    (value) => (value instanceof Date ? value.toISOString() : value),
    z.iso.datetime({ error: "La date de l'achat est requise" }),
  ),
  ingredientId: z.uuid("L'ingrédient est requis"),
  quantity: z
    .number({ error: "La quantité doit être un nombre" })
    .positive("La quantité doit être positive"),
});

export const updateIngredientPurchaseSchema = createIngredientPurchaseSchema;

export type CreateIngredientPurchaseDto = z.infer<
  typeof createIngredientPurchaseSchema
>;
export type UpdateIngredientPurchaseDto = z.infer<
  typeof updateIngredientPurchaseSchema
>;
