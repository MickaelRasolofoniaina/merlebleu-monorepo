import { z } from "zod";

export const createIngredientSchema = z
  .object({
    label: z.string().min(1, "Veuillez remplir le libellé de l'ingrédient"),
    unitId: z.uuid("L'unité est requise"),
    entryUnitId: z.uuid().nullable().optional(),
    entryUnitFactor: z
      .number({ error: "L'équivalence doit être un nombre" })
      .positive("L'équivalence doit être supérieure à 0")
      .nullable()
      .optional(),
    defaultPaymentMethodId: z.uuid().nullable().optional(),
  })
  .refine((value) => !value.entryUnitId || value.entryUnitFactor != null, {
    message: "L'équivalence doit être supérieure à 0",
    path: ["entryUnitFactor"],
  })
  .refine((value) => !value.entryUnitFactor || !!value.entryUnitId, {
    message: "Choisissez l'unité d'entrée correspondant à l'équivalence",
    path: ["entryUnitId"],
  })
  .refine((value) => !value.entryUnitId || value.entryUnitId !== value.unitId, {
    message: "L'unité d'entrée doit être différente de l'unité de stock",
    path: ["entryUnitId"],
  });

export const updateIngredientSchema = createIngredientSchema;

export const updateIngredientStockSchema = z.object({
  stock: z.number().min(0, "Le stock doit être supérieur ou égal à 0"),
});

export type CreateIngredientDto = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientDto = z.infer<typeof updateIngredientSchema>;
export type UpdateIngredientStockDto = z.infer<
  typeof updateIngredientStockSchema
>;
