import { z } from "zod";

export const closingPreviewQuerySchema = z.object({
  date: z.iso.date("La date de clôture est requise"),
});

export const createClosingSchema = z.object({
  date: z.iso.date("La date de clôture est requise"),
  /**
   * One entry per wallet shown in the preview. `calculatedAmount` is the balance the admin saw,
   * the server refuses the closing when it changed in the meantime.
   */
  counts: z.array(
    z.object({
      walletId: z.uuid("Le portefeuille est requis"),
      calculatedAmount: z
        .number("Le solde calculé est requis")
        .int("Le solde calculé doit être un nombre entier"),
      countedAmount: z
        .number("Le solde compté doit être un nombre")
        .int("Le solde compté doit être un nombre entier")
        .nullable()
        .optional(),
    }),
  ),
});

export type ClosingPreviewQueryDto = z.infer<typeof closingPreviewQuerySchema>;
export type CreateClosingDto = z.infer<typeof createClosingSchema>;
