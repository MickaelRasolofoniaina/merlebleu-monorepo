import { z } from "zod";

export const createIngredientUnitSchema = z.object({
  label: z.string().min(1, "Veuillez remplir le libellé de l'unité"),
});

export const updateIngredientUnitSchema = createIngredientUnitSchema;

export type CreateIngredientUnitDto = z.infer<typeof createIngredientUnitSchema>;
export type UpdateIngredientUnitDto = z.infer<typeof updateIngredientUnitSchema>;
