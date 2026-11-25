import {
  Expense,
  ExpenseNature,
  FixedExpenseType,
  PaymentMethod,
} from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { IngredientEntity } from '../ingredient/ingredient.entity';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import { ExpenseCategoryEntity } from './category/expense-category.entity';

export class ExpenseEntity implements Expense {
  id: string;
  nature: ExpenseNature;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  category: ExpenseCategoryEntity | null;
  ingredient: IngredientEntity | null;
  fixedType: FixedExpenseType | null;
  label: string | null;
  detail: string | null;
  note: string | null;
  paid: boolean | null;
}

export const ExpenseSchema = new EntitySchema<ExpenseEntity>({
  name: 'ExpenseEntity',
  tableName: 'expenses',
  target: ExpenseEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    nature: { type: 'enum', enum: ExpenseNature },
    date: { type: 'date' },
    amount: { type: 'integer' },
    fixedType: { type: 'enum', enum: FixedExpenseType, nullable: true },
    label: { type: 'varchar', length: 150, nullable: true },
    detail: { type: 'varchar', nullable: true },
    note: { type: 'varchar', nullable: true },
    paid: { type: 'boolean', nullable: true },
  },
  relations: {
    category: {
      type: 'many-to-one',
      target: () => ExpenseCategoryEntity,
      joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
      nullable: true,
      onDelete: 'RESTRICT',
      eager: true,
    },
    ingredient: {
      type: 'many-to-one',
      target: () => IngredientEntity,
      joinColumn: { name: 'ingredientId', referencedColumnName: 'id' },
      nullable: true,
      onDelete: 'RESTRICT',
      eager: true,
    },
    paymentMethod: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'paymentMethodId', referencedColumnName: 'id' },
      nullable: true,
      onDelete: 'RESTRICT',
      eager: true,
    },
  },
  indices: [
    { name: 'IDX_expenses_date', columns: ['date'] },
    {
      // One grid cell per category and day
      name: 'UQ_expenses_variable_category_date',
      columns: ['date', 'category'],
      unique: true,
      where: `"nature" = 'VARIABLE' AND "categoryId" IS NOT NULL`,
    },
    {
      // One grid cell per ingredient and day
      name: 'UQ_expenses_variable_ingredient_date',
      columns: ['date', 'ingredient'],
      unique: true,
      where: `"nature" = 'VARIABLE' AND "ingredientId" IS NOT NULL`,
    },
  ],
  checks: [
    {
      name: 'CHK_expenses_nature_columns',
      expression: `("nature" = 'FIXED' AND "fixedType" IS NOT NULL AND "label" IS NOT NULL AND "categoryId" IS NULL AND "ingredientId" IS NULL) OR ("nature" = 'VARIABLE' AND "fixedType" IS NULL AND (("categoryId" IS NOT NULL) <> ("ingredientId" IS NOT NULL)))`,
    },
  ],
});
