import { ExpenseCategory, ExpenseSection } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';

export class ExpenseCategoryEntity implements ExpenseCategory {
  id: string;
  label: string;
  section: ExpenseSection.CURRENT | ExpenseSection.OTHER;
}

export const ExpenseCategorySchema = new EntitySchema<ExpenseCategoryEntity>({
  name: 'ExpenseCategoryEntity',
  tableName: 'expense_categories',
  target: ExpenseCategoryEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    label: { type: 'varchar', length: 150 },
    section: { type: 'enum', enum: ExpenseSection },
  },
  uniques: [
    {
      name: 'UQ_expense_categories_section_label',
      columns: ['section', 'label'],
    },
  ],
});
