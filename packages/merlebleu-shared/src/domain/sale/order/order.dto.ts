import { z } from "zod";
import { OrderStatus, Shape } from "./order";

export const createOrderItemSchema = z.object({
  type: z
    .string()
    .min(1, "Veuillez remplir le type de l'article"),
  size: z.number().positive("La taille doit être un nombre positif"),
  unitPrice: z
    .number()
    .positive("Le prix unitaire doit être un nombre positif"),
  totalAmount: z
    .number()
    .positive("Le montant total doit être un nombre positif"),
  shape: z.enum(Shape, "Veuillez sélectionner une forme"),
  text: z.string().optional(),
  decoration: z.string().optional(),
  remarks: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const createOrderSchema = z
  .object({
    orderDate: z
      .string()
      .min(1, "La date de commande ne peut pas être vide")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "La date de commande doit être une date valide" },
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
    deliveryDate: z
      .string()
      .min(1, "La date de livraison ne peut pas être vide")
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "La date de livraison doit être une date valide" },
      )
      .refine(
        (val) => {
          const deliveryDate = new Date(val);
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return deliveryDate >= startOfToday;
        },
        {
          message:
            "La date de livraison doit être aujourd'hui ou une date future",
        },
      ),
    deliveryStartTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "L'heure de début de livraison doit être au format HH:mm",
      ),
    deliveryEndTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "L'heure de fin de livraison doit être au format HH:mm",
      ),
    deliveryAddress: z.string().optional(),
    isFromFacebook: z.boolean(),
    orderItems: z
      .array(createOrderItemSchema)
      .min(1, "Veuillez ajouter au moins un article à la commande"),
    remarks: z.string().optional(),
    totalAmount: z
      .number()
      .positive("Le montant total doit être un nombre positif"),
    deliveryFee: z
      .number()
      .nonnegative("Les frais de livraison doivent être un nombre positif ou zéro"),
    paidAmount: z
      .number()
      .nonnegative("Le montant payé doit être un nombre positif ou zéro"),
    balanceAmount: z
      .number()
      .nonnegative("Le montant du solde doit être un nombre positif ou zéro"),
    paymentMethodId: z
      .string()
      .min(1, "Veuillez sélectionner une méthode de paiement"),
    shopId: z
      .string()
      .uuid({ message: "Veuillez sélectionner une boutique" })
      .min(1, "Veuillez sélectionner une boutique"),
  })
  .refine(
    (data) => {
      const orderDate = new Date(data.orderDate);
      const deliveryDate = new Date(data.deliveryDate);
      return deliveryDate >= orderDate;
    },
    {
      message:
        "La date de livraison ne peut pas être antérieure à la date de commande",
      path: ["deliveryDate"],
    },
  )
  .refine((data) => data.paidAmount <= data.totalAmount + data.deliveryFee, {
    message: "L'avance payée ne peut pas être supérieure au montant total",
    path: ["paidAmount"],
  })
  .refine((data) => data.deliveryEndTime >= data.deliveryStartTime, {
    message:
      "L'heure de fin de livraison ne peut pas être avant l'heure de début de livraison",
    path: ["deliveryEndTime"],
  });

export const updateOrderSchema = createOrderSchema;

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;

export type OrderItemDto = z.infer<typeof createOrderItemSchema>;

export interface OrderItemRowDto {
  orderId: string;
  itemId: string;
  orderStatus?: OrderStatus;
  customerName: string;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  type: string;
  shape: Shape;
  text?: string;
  decoration?: string;
  size: number;
}
