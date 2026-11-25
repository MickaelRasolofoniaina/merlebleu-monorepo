import { ExpenseSection } from '@merlebleu/shared';

type SectionSeverity = 'success' | 'info' | 'warn';

export const EXPENSE_SECTIONS: { value: ExpenseSection; label: string; severity: SectionSeverity }[] = [
  { value: ExpenseSection.CURRENT, label: 'Courante', severity: 'success' },
  { value: ExpenseSection.INGREDIENT, label: 'Ingrédients', severity: 'info' },
  { value: ExpenseSection.OTHER, label: 'Autre', severity: 'warn' },
];

/** Ingredients come from the ingredients table, so this section is not offered on the categories page. */
export const CATEGORY_SECTIONS = EXPENSE_SECTIONS.filter((s) => s.value !== ExpenseSection.INGREDIENT);

export const getSectionLabel = (section: ExpenseSection): string =>
  EXPENSE_SECTIONS.find((s) => s.value === section)?.label ?? section;

export const getSectionSeverity = (section: ExpenseSection): SectionSeverity =>
  EXPENSE_SECTIONS.find((s) => s.value === section)?.severity ?? 'info';

/** Formats a calendar date as YYYY-MM-DD from a 0-based month, without any timezone conversion. */
export const toIsoDate = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Day of the month of a YYYY-MM-DD date. */
export const dayOfDate = (date: string): number => Number(date.slice(8, 10));
