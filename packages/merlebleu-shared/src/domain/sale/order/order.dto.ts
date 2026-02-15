import { z } from "zod";

export const createOrderItemSchema = z.object({
  description: z
    .string()
    .min(1, "Veuillez remplir la description de l'article"),
  size: z.number().positive("La taille doit être un nombre positif"),
  totalAmount: z
    .number()
    .positive("Le montant total doit être un nombre positif"),
  remarks: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const createOrderSchema = z.object({
  orderDate: z.coerce.date(
    "La date de commande doit être une date/heure valide",
  ),
  customerName: z.string().min(1, "Veuillez remplir le nom du client"),
  customerPhoneNumber: z
    .string()
    .min(1, "Veuillez remplir le numéro de téléphone du client")
    .regex(
      /^(034|032|033|038|036)\d{7}(\s+(034|032|033|038|036)\d{7})*$/,
      "Le numéro de téléphone doit commencer par 034, 032, 033, 038 ou 036 et contenir exactement 10 chiffres (séparés par des espaces si plusieurs)",
    ),
  customerFacebookName: z.string().optional(),
  deliveryDate: z.coerce
    .date("La date de livraison doit être une date/heure valide")
    .refine((value) => {
      const deliveryDate = new Date(value);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return deliveryDate >= startOfToday;
    }, "La date de livraison doit être aujourd'hui ou une date future"),
  deliveryAddress: z.string().min(1, "Veuillez remplir l'adresse de livraison"),
  isFromFacebook: z.boolean(),
  orderItems: z
    .array(createOrderItemSchema)
    .min(1, "Veuillez ajouter au moins un article à la commande"),
  remarks: z.string().optional(),
  totalAmount: z
    .number()
    .positive("Le montant total doit être un nombre positif"),
  paidAmount: z
    .number()
    .nonnegative("Le montant payé doit être un nombre positif ou zéro"),
  balanceAmount: z
    .number()
    .nonnegative("Le montant du solde doit être un nombre positif ou zéro"),
  paymentMethodId: z
    .string()
    .min(1, "Veuillez sélectionner une méthode de paiement"),
});

export const updateOrderSchema = createOrderSchema;

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;

export type OrderItemDto = z.infer<typeof createOrderItemSchema>;
