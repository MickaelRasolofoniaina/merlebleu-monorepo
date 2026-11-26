import { ExpenseCategory, ExpenseSection } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { PaymentMethodEntity } from '../../sale/payment/payment.entity';

export class ExpenseCategoryEntity implements ExpenseCategory {
  id: string;
  label: string;
  section: ExpenseSection.CURRENT | ExpenseSection.OTHER;
  defaultPaymentMethod: PaymentMethodEntity | null;
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
  relations: {
    defaultPaymentMethod: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: {
        name: 'defaultPaymentMethodId',
        referencedColumnName: 'id',
      },
      nullable: true,
      onDelete: 'SET NULL',
      eager: true,
    },
  },
  uniques: [
    {
      name: 'UQ_expense_categories_section_label',
      columns: ['section', 'label'],
    },
  ],
});
