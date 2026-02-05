import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, "Veuillez remplir la méthode de paiement"),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, "Veuillez remplir la méthode de paiement"),
});

// DTO types

export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>;
