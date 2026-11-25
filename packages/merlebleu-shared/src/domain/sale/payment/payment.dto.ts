import { z } from "zod";
import { DEFAULT_PAYMENT_METHOD_COLOR } from "./payment";

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, "Veuillez remplir la méthode de paiement"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Veuillez choisir une couleur valide")
    .default(DEFAULT_PAYMENT_METHOD_COLOR),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema;

// DTO types

export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>;
