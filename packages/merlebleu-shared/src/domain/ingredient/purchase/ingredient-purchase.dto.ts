import { z } from "zod";

export const createIngredientPurchaseSchema = z.object({
  purchaseDate: z.coerce.date({ error: "La date de l'achat est requise" }),
  ingredientId: z.string().uuid("L'ingrédient est requis"),
  quantity: z
    .number({ error: "La quantité doit être un nombre" })
    .positive("La quantité doit être positive"),
});

export const updateIngredientPurchaseSchema = createIngredientPurchaseSchema;

export type CreateIngredientPurchaseDto = z.infer<typeof createIngredientPurchaseSchema>;
export type UpdateIngredientPurchaseDto = z.infer<typeof updateIngredientPurchaseSchema>;
