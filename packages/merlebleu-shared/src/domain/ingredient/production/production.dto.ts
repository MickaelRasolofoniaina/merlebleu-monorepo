import { z } from "zod";
import { hasMaxTwoDecimals } from "../recipe/recipe.dto";

export const productionLineSchema = z.object({
  recipeId: z.uuid("La recette est requise"),
  quantity: z
    .number({ error: "Le nombre de fournées doit être un nombre" })
    .positive("Le nombre de fournées doit être supérieur à 0")
    .refine(
      hasMaxTwoDecimals,
      "Le nombre de fournées accepte 2 décimales au maximum",
    ),
});

/** Replaces all the productions of a day (an empty list clears the day). */
export const saveProductionDaySchema = z
  .object({
    productionDate: z.iso.date("La date de production est requise"),
    lines: z.array(productionLineSchema),
  })
  .refine(
    ({ lines }) =>
      new Set(lines.map((line) => line.recipeId)).size === lines.length,
    {
      message: "Une recette ne peut apparaître qu'une seule fois par jour",
      path: ["lines"],
    },
  );

export type ProductionLineDto = z.infer<typeof productionLineSchema>;
export type SaveProductionDayDto = z.infer<typeof saveProductionDaySchema>;
