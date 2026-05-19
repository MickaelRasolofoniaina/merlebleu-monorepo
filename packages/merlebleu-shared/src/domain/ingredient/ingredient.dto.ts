import { z } from "zod";

export const createIngredientSchema = z.object({
  label: z.string().min(1, "Veuillez remplir le libellé de l'ingrédient"),
  categoryId: z.string().uuid("La catégorie est requise"),
  unitId: z.string().uuid("L'unité est requise"),
  unitPrice: z
    .number()
    .int("Le prix unitaire doit être un entier")
    .positive("Le prix unitaire doit être positif"),
});

export const updateIngredientSchema = createIngredientSchema;

export const updateIngredientStockSchema = z.object({
  stock: z.number().min(0, 'Le stock doit être supérieur ou égal à 0'),
});

export type CreateIngredientDto = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientDto = z.infer<typeof updateIngredientSchema>;
export type UpdateIngredientStockDto = z.infer<typeof updateIngredientStockSchema>;
