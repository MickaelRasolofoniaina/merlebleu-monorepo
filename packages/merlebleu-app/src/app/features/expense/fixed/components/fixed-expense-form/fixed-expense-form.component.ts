import { Component, OnChanges, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  EXPENSE_PAYMENT_METHODS,
  ExpensePaymentMethod,
  FixedExpense,
  FixedExpenseType,
} from '../../../expense.model';

export type FixedExpenseFormValue = Omit<FixedExpense, 'id' | 'month'>;

@Component({
  selector: 'mb-fixed-expense-form',
  templateUrl: './fixed-expense-form.component.html',
  imports: [FormsModule, InputNumberModule, InputTextModule, SelectModule],
})
export class FixedExpenseFormComponent implements OnChanges {
  readonly formId = input('fixed-expense-form');
  readonly type = input<FixedExpenseType>('SALARY');
  readonly expense = input<FixedExpense | null>(null);
  readonly save = output<FixedExpenseFormValue>();

  protected readonly paymentMethods = EXPENSE_PAYMENT_METHODS;

  protected label = '';
  protected detail = '';
  protected amount: number | null = null;
  protected paymentMethod: ExpensePaymentMethod = 'Espèces';
  protected submitted = false;

  ngOnChanges(): void {
    this.submitted = false;
    const expense = this.expense();
    this.label = expense?.label ?? '';
    this.detail = expense?.detail ?? '';
    this.amount = expense?.amount ?? null;
    this.paymentMethod = expense?.paymentMethod ?? 'Espèces';
  }

  protected onSubmit(): void {
    this.submitted = true;
    if (!this.label.trim() || !this.amount || this.amount <= 0) return;
    this.save.emit({
      type: this.type(),
      label: this.label.trim(),
      detail: this.detail.trim(),
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      paid: this.expense()?.paid ?? false,
    });
  }
}
