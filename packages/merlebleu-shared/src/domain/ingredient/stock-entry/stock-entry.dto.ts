import { z } from "zod";

export const MAX_STOCK_ENTRY_LINES = 100;

const entryDateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime({ error: "La date de l'entrée est requise" }),
);

const quantitySchema = z
  .number({ error: "La quantité doit être un nombre" })
  .positive("La quantité doit être positive");

/** Which unit the typed quantity is expressed in: the entry unit (bag) or the stock unit (g). */
export const stockEntryUnitSchema = z.enum(["entry", "stock"]);

export const stockEntryLineSchema = z.object({
  ingredientId: z.uuid("L'ingrédient est requis"),
  quantity: quantitySchema,
  /** Defaults to the stock unit when omitted. */
  unit: stockEntryUnitSchema.optional(),
});

export const createStockEntriesSchema = z.object({
  entryDate: entryDateSchema,
  lines: z
    .array(stockEntryLineSchema)
    .min(1, "Ajoutez au moins une ligne")
    .max(
      MAX_STOCK_ENTRY_LINES,
      `Une entrée ne peut pas dépasser ${MAX_STOCK_ENTRY_LINES} lignes`,
    )
    .refine(
      (lines) =>
        new Set(lines.map((line) => line.ingredientId)).size === lines.length,
      "Un ingrédient ne peut apparaître qu'une seule fois",
    ),
});

export const updateStockEntrySchema = z.object({
  entryDate: entryDateSchema,
  ingredientId: z.uuid("L'ingrédient est requis"),
  quantity: quantitySchema,
});

export type StockEntryUnit = z.infer<typeof stockEntryUnitSchema>;
export type StockEntryLineDto = z.infer<typeof stockEntryLineSchema>;
export type CreateStockEntriesDto = z.infer<typeof createStockEntriesSchema>;
export type UpdateStockEntryDto = z.infer<typeof updateStockEntrySchema>;
