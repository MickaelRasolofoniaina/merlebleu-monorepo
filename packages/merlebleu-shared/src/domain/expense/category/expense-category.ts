export enum ExpenseSection {
  CURRENT = "CURRENT",
  INGREDIENT = "INGREDIENT",
  OTHER = "OTHER",
}

export interface ExpenseCategory {
  id: string;
  label: string;
  /** Categories only belong to CURRENT or OTHER: the INGREDIENT section is fed by the ingredients table. */
  section: ExpenseSection.CURRENT | ExpenseSection.OTHER;
}
