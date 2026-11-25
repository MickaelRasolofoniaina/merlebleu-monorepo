import { Component, OnChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ExpenseStoreService } from '../../../expense-store.service';
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_SECTIONS,
  Expense,
  ExpensePaymentMethod,
  ExpenseSection,
} from '../../../expense.model';
import { formatUnitPrice } from '@shared/utils/number';

export type ExpenseFormValue = Omit<Expense, 'id'>;

@Component({
  selector: 'mb-expense-form',
  templateUrl: './expense-form.component.html',
  imports: [FormsModule, DatePickerModule, InputNumberModule, InputTextModule, SelectModule, SelectButtonModule],
})
export class ExpenseFormComponent implements OnChanges {
  private readonly store = inject(ExpenseStoreService);

  readonly formId = input('expense-form');
  readonly expense = input<Expense | null>(null);
  readonly save = output<ExpenseFormValue>();
  readonly saveAndAddAnother = output<ExpenseFormValue>();

  protected readonly formatAmount = formatUnitPrice;
  protected readonly sections = EXPENSE_SECTIONS;
  protected readonly paymentMethods = EXPENSE_PAYMENT_METHODS;

  protected readonly section = signal<ExpenseSection>('CURRENT');
  protected readonly categoryId = signal<string | null>(null);
  protected date: Date | null = new Date();
  protected amount: number | null = null;
  protected paymentMethod: ExpensePaymentMethod = 'Espèces';
  protected note = '';
  protected submitted = false;

  protected readonly categories = computed(() =>
    this.store.categories().filter((c) => c.section === this.section()),
  );
  protected readonly selectedCategory = computed(() =>
    this.categoryId() ? this.store.getCategory(this.categoryId()!) : undefined,
  );

  ngOnChanges(): void {
    this.submitted = false;
    const expense = this.expense();
    if (expense) {
      const category = this.store.getCategory(expense.categoryId);
      this.section.set(category?.section ?? 'CURRENT');
      this.categoryId.set(expense.categoryId);
      this.date = expense.date;
      this.amount = expense.amount;
      this.paymentMethod = expense.paymentMethod;
      this.note = expense.note;
    } else {
      this.reset();
    }
  }

  protected onSectionChange(section: ExpenseSection): void {
    this.section.set(section);
    this.categoryId.set(null);
  }

  protected onCategoryChange(categoryId: string): void {
    this.categoryId.set(categoryId);
    const category = this.store.getCategory(categoryId);
    if (category && !this.amount) {
      this.amount = category.usualAmount;
    }
  }

  protected onSubmit(event: Event): void {
    this.submitted = true;
    if (!this.categoryId() || !this.date || !this.amount || this.amount <= 0) return;

    const value: ExpenseFormValue = {
      date: this.date,
      categoryId: this.categoryId()!,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      note: this.note.trim(),
    };
    const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
    if (submitter?.dataset['action'] === 'another') {
      this.saveAndAddAnother.emit(value);
      this.reset(value.date);
    } else {
      this.save.emit(value);
    }
  }

  private reset(date: Date = new Date()): void {
    this.submitted = false;
    this.categoryId.set(null);
    this.date = date;
    this.amount = null;
    this.paymentMethod = 'Espèces';
    this.note = '';
  }
}
