import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CreateFixedExpenseDto,
  Expense,
  FixedExpenseType,
  PaymentMethod,
  createFixedExpenseSchema,
} from '@merlebleu/shared';
import { dayOfDate, toIsoDate } from '../../../expense.model';

@Component({
  selector: 'mb-fixed-expense-form',
  templateUrl: './fixed-expense-form.component.html',
  imports: [FormsModule, InputNumberModule, InputTextModule, SelectModule],
})
export class FixedExpenseFormComponent {
  readonly formId = input('fixed-expense-form');
  readonly type = input<FixedExpenseType>(FixedExpenseType.SALARY);
  readonly expense = input<Expense | null>(null);
  readonly paymentMethods = input<PaymentMethod[]>([]);
  /** Selected month: the expense date is a day of this month. */
  readonly year = input.required<number>();
  /** 0-based month, like `Date`. */
  readonly month = input.required<number>();
  readonly daysInMonth = input.required<number>();
  readonly save = output<CreateFixedExpenseDto>();

  protected readonly label = signal('');
  protected readonly detail = signal('');
  protected readonly amount = signal<number | null>(null);
  protected readonly day = signal<number | null>(1);
  protected readonly paymentMethodId = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly isSalary = computed(() => this.type() === FixedExpenseType.SALARY);

  private readonly result = computed(() => {
    const day = this.day();
    return createFixedExpenseSchema.safeParse({
      date: day ? toIsoDate(this.year(), this.month(), Math.min(day, this.daysInMonth())) : '',
      fixedType: this.type(),
      label: this.label(),
      detail: this.detail() || undefined,
      amount: this.amount() ?? undefined,
      paymentMethodId: this.paymentMethodId() ?? undefined,
      paid: this.expense()?.paid ?? false,
    });
  });

  private readonly errors = computed(() => {
    const result = this.result();
    const errors = new Map<string, string>();
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors.has(field)) errors.set(field, issue.message);
      }
    }
    return errors;
  });

  protected error(field: string): string | null {
    return this.submitted() ? (this.errors().get(field) ?? null) : null;
  }

  constructor() {
    effect(() => {
      const expense = this.expense();
      this.submitted.set(false);
      this.label.set(expense?.label ?? '');
      this.detail.set(expense?.detail ?? '');
      this.amount.set(expense?.amount ?? null);
      this.day.set(expense ? dayOfDate(expense.date) : this.defaultDay());
      this.paymentMethodId.set(expense?.paymentMethod?.id ?? this.defaultPaymentMethodId());
    });
  }

  /** Back to an empty form (default day and payment method), without validation errors. */
  reset(): void {
    this.submitted.set(false);
    this.label.set('');
    this.detail.set('');
    this.amount.set(null);
    this.day.set(this.defaultDay());
    this.paymentMethodId.set(this.defaultPaymentMethodId());
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    const result = this.result();
    if (result.success) {
      this.save.emit(result.data);
    }
  }

  /** Today when the selected month is the current one, otherwise the first day. */
  private defaultDay(): number {
    const now = new Date();
    return now.getFullYear() === this.year() && now.getMonth() === this.month() ? now.getDate() : 1;
  }

  /** Cash when it exists, otherwise the first payment method. */
  private defaultPaymentMethodId(): string | null {
    const methods = this.paymentMethods();
    const cash = methods.find((m) => /esp[èe]ces/i.test(m.name));
    return (cash ?? methods[0])?.id ?? null;
  }
}
