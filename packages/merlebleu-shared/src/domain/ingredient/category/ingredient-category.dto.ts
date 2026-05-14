import { z } from "zod";

export const createIngredientCategorySchema = z.object({
  label: z.string().min(1, "Veuillez remplir le libellé de la catégorie"),
});

export const updateIngredientCategorySchema = createIngredientCategorySchema;

export type CreateIngredientCategoryDto = z.infer<typeof createIngredientCategorySchema>;
export type UpdateIngredientCategoryDto = z.infer<typeof updateIngredientCategorySchema>;
