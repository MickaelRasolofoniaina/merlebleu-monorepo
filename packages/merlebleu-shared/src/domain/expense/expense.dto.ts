import { z } from "zod";
import { ExpenseNature, FixedExpenseType } from "./expense";

// Expenses are calendar days (no time of day), so they use a plain YYYY-MM-DD date instead of
// the ISO datetime pattern: a datetime would shift to the previous day once converted to UTC.
const expenseDateSchema = z.iso.date("La date est requise");

export const createFixedExpenseSchema = z.object({
  date: expenseDateSchema,
  fixedType: z.enum(FixedExpenseType, "Le type doit être valide"),
  label: z.string().trim().min(1, "Veuillez remplir la désignation"),
  detail: z.string().trim().optional(),
  amount: z
    .number("Le montant est requis")
    .int("Le montant doit être un nombre entier")
    .positive("Le montant doit être positif"),
  paymentMethodId: z.uuid("Le moyen de paiement est requis"),
  paid: z.boolean().default(false),
});

export const updateFixedExpenseSchema = createFixedExpenseSchema;

export const setExpenseCellSchema = z
  .object({
    date: expenseDateSchema,
    categoryId: z.uuid().optional(),
    ingredientId: z.uuid().optional(),
    amount: z
      .number("Le montant est requis")
      .int("Le montant doit être un nombre entier")
      .min(0, "Le montant doit être supérieur ou égal à 0"),
    /** Overrides the default wallet of the category or ingredient. */
    paymentMethodId: z.uuid().optional(),
  })
  .refine((value) => Boolean(value.categoryId) !== Boolean(value.ingredientId), {
    message: "Indiquez soit une catégorie, soit un ingrédient",
    path: ["categoryId"],
  });

export const setExpensePaidSchema = z.object({
  paid: z.boolean(),
});

/** Month is 1-12. */
export const expenseMonthSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12),
});

export const listExpensesQuerySchema = expenseMonthSchema.extend({
  nature: z.enum(ExpenseNature).optional(),
});

export const copyFixedExpensesSchema = expenseMonthSchema;

// DTO types

export type CreateFixedExpenseDto = z.infer<typeof createFixedExpenseSchema>;
export type UpdateFixedExpenseDto = z.infer<typeof updateFixedExpenseSchema>;
export type SetExpenseCellDto = z.infer<typeof setExpenseCellSchema>;
export type SetExpensePaidDto = z.infer<typeof setExpensePaidSchema>;
export type ExpenseMonthDto = z.infer<typeof expenseMonthSchema>;
export type ListExpensesQueryDto = z.infer<typeof listExpensesQuerySchema>;
export type CopyFixedExpensesDto = z.infer<typeof copyFixedExpensesSchema>;
