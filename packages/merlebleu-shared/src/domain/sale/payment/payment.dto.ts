import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1),
});

export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>;
