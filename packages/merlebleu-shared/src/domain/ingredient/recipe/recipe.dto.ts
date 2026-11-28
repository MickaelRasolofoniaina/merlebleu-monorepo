import { z } from "zod";

export const hasMaxTwoDecimals = (value: number): boolean =>
  Math.round(value * 100) / 100 === value;

export const recipeLineSchema = z.object({
  ingredientId: z.uuid("L'ingrédient est requis"),
  quantity: z
    .number({ error: "La dose doit être un nombre" })
    .positive("La dose doit être supérieure à 0")
    .refine(hasMaxTwoDecimals, "La dose accepte 2 décimales au maximum"),
});

export const createRecipeSchema = z
  .object({
    name: z.string().trim().min(1, "Veuillez saisir le nom de la recette"),
    lines: z.array(recipeLineSchema).min(1, "Ajoutez au moins un ingrédient"),
  })
  .refine(
    ({ lines }) =>
      new Set(lines.map((line) => line.ingredientId)).size === lines.length,
    {
      message: "Un ingrédient ne peut apparaître qu'une seule fois",
      path: ["lines"],
    },
  );

export const updateRecipeSchema = createRecipeSchema;

export type RecipeLineDto = z.infer<typeof recipeLineSchema>;
export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeDto = z.infer<typeof updateRecipeSchema>;
