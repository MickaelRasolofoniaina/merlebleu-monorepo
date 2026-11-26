import { z } from "zod";

export const updateWalletSchema = z.object({
  name: z.string().trim().min(1, "Veuillez remplir le nom du portefeuille"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Veuillez choisir une couleur valide"),
  openingBalance: z
    .number("Le solde initial est requis")
    .int("Le solde initial doit être un nombre entier"),
  openingDate: z.iso.date("La date du solde initial est requise").nullable(),
  archived: z.boolean(),
}).refine((value) => value.openingBalance === 0 || value.openingDate !== null, {
  message: "La date du solde initial est requise",
  path: ["openingDate"],
});

export const createTransferSchema = z
  .object({
    fromWalletId: z.uuid("Le portefeuille d'origine est requis"),
    toWalletId: z.uuid("Le portefeuille de destination est requis"),
    amount: z
      .number("Le montant est requis")
      .int("Le montant doit être un nombre entier")
      .positive("Le montant doit être positif"),
    date: z.iso.date("La date est requise"),
    note: z.string().trim().max(200).optional(),
  })
  .refine((value) => value.fromWalletId !== value.toWalletId, {
    message: "Les deux portefeuilles doivent être différents",
    path: ["toWalletId"],
  });

export const createRefundSchema = z.object({
  orderId: z.uuid("La commande est requise"),
  walletId: z.uuid("Le portefeuille est requis"),
  amount: z
    .number("Le montant est requis")
    .int("Le montant doit être un nombre entier")
    .positive("Le montant doit être positif"),
  date: z.iso.date("La date est requise"),
  reason: z.string().trim().max(200).optional(),
});

export const createCashCountSchema = z.object({
  walletId: z.uuid("Le portefeuille est requis"),
  date: z.iso.date("La date est requise"),
  countedAmount: z
    .number("Le solde compté est requis")
    .int("Le solde compté doit être un nombre entier"),
  note: z.string().trim().max(200).optional(),
});

export type UpdateWalletDto = z.infer<typeof updateWalletSchema>;
export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type CreateRefundDto = z.infer<typeof createRefundSchema>;
export type CreateCashCountDto = z.infer<typeof createCashCountSchema>;
