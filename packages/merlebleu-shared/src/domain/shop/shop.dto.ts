import { z } from "zod";

export const createShopSchema = z.object({
  address: z.string().min(1, "Veuillez remplir l'adresse de la boutique"),
});

export const updateShopSchema = createShopSchema;

export type CreateShopDto = z.infer<typeof createShopSchema>;
export type UpdateShopDto = z.infer<typeof updateShopSchema>;
