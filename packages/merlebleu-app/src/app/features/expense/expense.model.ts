// Static prototype models. They will move to @merlebleu/shared once the pages are validated.

export type ExpenseSection = 'CURRENT' | 'INGREDIENT' | 'OTHER';
export type FixedExpenseType = 'SALARY' | 'CHARGE';
export type ExpensePaymentMethod = 'Espèces' | 'Mvola';

export interface ExpenseCategory {
  id: string;
  label: string;
  section: ExpenseSection;
  linkedIngredient: string | null;
  usualAmount: number;
}

export interface Expense {
  id: string;
  date: Date;
  categoryId: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  note: string;
}

export interface FixedExpense {
  id: string;
  /** Month key, formatted YYYY-MM. */
  month: string;
  type: FixedExpenseType;
  label: string;
  detail: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  paid: boolean;
}

export const EXPENSE_SECTIONS: { value: ExpenseSection; label: string; severity: 'success' | 'info' | 'warn' }[] = [
  { value: 'CURRENT', label: 'Courante', severity: 'success' },
  { value: 'INGREDIENT', label: 'Ingrédients', severity: 'info' },
  { value: 'OTHER', label: 'Autre', severity: 'warn' },
];

export const EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = ['Espèces', 'Mvola'];

export const LINKABLE_INGREDIENTS = [
  'Crème',
  'Farine',
  'Sucre',
  'Huile',
  'Chocolat',
  'Cacao',
  'Margarine',
  'Lait en poudre',
  'Œuf',
  'Beurre',
];

export const getSectionLabel = (section: ExpenseSection): string =>
  EXPENSE_SECTIONS.find((s) => s.value === section)?.label ?? section;

export const getSectionSeverity = (section: ExpenseSection): 'success' | 'info' | 'warn' =>
  EXPENSE_SECTIONS.find((s) => s.value === section)?.severity ?? 'info';

// Tailwind only generates classes it can read as whole strings, so each color is spelled out
const SECTION_DOT_CLASSES: Record<ExpenseSection, string> = {
  CURRENT: 'bg-green-400',
  INGREDIENT: 'bg-blue-400',
  OTHER: 'bg-amber-400',
};

export const getSectionDotClass = (section: ExpenseSection): string => SECTION_DOT_CLASSES[section];

export const toMonthKey= (year: number, month: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}`;
