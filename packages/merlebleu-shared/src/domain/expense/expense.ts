import { Ingredient } from "../ingredient/ingredient";
import { PaymentMethod } from "../sale/payment/payment";
import { ExpenseCategory } from "./category/expense-category";

export enum ExpenseNature {
  FIXED = "FIXED",
  VARIABLE = "VARIABLE",
}

export enum FixedExpenseType {
  SALARY = "SALARY",
  CHARGE = "CHARGE",
}

/**
 * Single expense entity.
 * - VARIABLE: one grid cell, linked to exactly one of `category` / `ingredient`.
 * - FIXED: a salary or a charge, described by `fixedType`, `label` and `detail`.
 */
export interface Expense {
  id: string;
  nature: ExpenseNature;
  /** Calendar date, formatted YYYY-MM-DD. */
  date: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  category: ExpenseCategory | null;
  ingredient: Ingredient | null;
  fixedType: FixedExpenseType | null;
  label: string | null;
  detail: string | null;
  note: string | null;
  paid: boolean | null;
}
