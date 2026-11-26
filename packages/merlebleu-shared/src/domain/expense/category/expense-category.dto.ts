import { z } from "zod";
import { ExpenseSection } from "./expense-category";

export const createExpenseCategorySchema = z.object({
  label: z.string().trim().min(1, "Veuillez remplir la désignation"),
  section: z.enum(
    [ExpenseSection.CURRENT, ExpenseSection.OTHER],
    "La section doit être valide",
  ),
  defaultPaymentMethodId: z.uuid().nullable().optional(),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema;

// DTO types

export type CreateExpenseCategoryDto = z.infer<
  typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryDto = z.infer<
  typeof updateExpenseCategorySchema
>;
