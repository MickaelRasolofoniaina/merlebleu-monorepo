import { Injectable, computed, signal } from '@angular/core';
import {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  FixedExpense,
  toMonthKey,
} from './expense.model';
import { SEED_CATEGORIES, SEED_FIXED_EXPENSES } from './expense.seed';

/**
 * In-memory store used while the expense pages are a static prototype.
 * Replaced by real API services once the pages are validated.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseStoreService {
  private idCounter = 0;

  readonly year = signal(2026);
  readonly month = signal(9);
  readonly monthKey = computed(() => toMonthKey(this.year(), this.month()));
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
      .format(new Date(this.year(), this.month(), 1))
      .replace(/^./, (c) => c.toUpperCase()),
  );
  readonly daysInMonth = computed(() => new Date(this.year(), this.month() + 1, 0).getDate());

  readonly categories = signal<ExpenseCategory[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly fixedExpenses = signal<FixedExpense[]>([]);

  readonly monthExpenses = computed(() =>
    this.expenses().filter(
      (e) => e.date.getFullYear() === this.year() && e.date.getMonth() === this.month(),
    ),
  );
  readonly monthFixedExpenses = computed(() =>
    this.fixedExpenses().filter((e) => e.month === this.monthKey()),
  );

  constructor() {
    this.seed();
  }

  nextId(prefix: string): string {
    this.idCounter += 1;
    return `${prefix}-${this.idCounter}`;
  }

  changeMonth(delta: number): void {
    const date = new Date(this.year(), this.month() + delta, 1);
    this.year.set(date.getFullYear());
    this.month.set(date.getMonth());
  }

  getCategory(id: string): ExpenseCategory | undefined {
    return this.categories().find((c) => c.id === id);
  }

  // Expenses
  addExpense(data: Omit<Expense, 'id'>): void {
    this.expenses.update((list) => [...list, { ...data, id: this.nextId('expense') }]);
  }

  updateExpense(id: string, data: Omit<Expense, 'id'>): void {
    this.expenses.update((list) => list.map((e) => (e.id === id ? { ...data, id } : e)));
  }

  deleteExpense(id: string): void {
    this.expenses.update((list) => list.filter((e) => e.id !== id));
  }

  /** Sets the total of a category for one day (grid cell). An amount of 0 clears the cell. */
  setCell(categoryId: string, day: number, amount: number, paymentMethod: ExpensePaymentMethod = 'Espèces'): void {
    const isSameCell = (e: Expense) =>
      e.categoryId === categoryId &&
      e.date.getFullYear() === this.year() &&
      e.date.getMonth() === this.month() &&
      e.date.getDate() === day;
    this.expenses.update((list) => list.filter((e) => !isSameCell(e)));
    if (amount > 0) {
      this.addExpense({
        date: new Date(this.year(), this.month(), day),
        categoryId,
        amount,
        paymentMethod,
        note: '',
      });
    }
  }

  // Categories
  addCategory(data: Omit<ExpenseCategory, 'id'>): void {
    this.categories.update((list) => [...list, { ...data, id: this.nextId('category') }]);
  }

  updateCategory(id: string, data: Omit<ExpenseCategory, 'id'>): void {
    this.categories.update((list) => list.map((c) => (c.id === id ? { ...data, id } : c)));
  }

  deleteCategory(id: string): void {
    this.categories.update((list) => list.filter((c) => c.id !== id));
    this.expenses.update((list) => list.filter((e) => e.categoryId !== id));
  }

  // Fixed expenses
  addFixedExpense(data: Omit<FixedExpense, 'id' | 'month'>): void {
    this.fixedExpenses.update((list) => [
      ...list,
      { ...data, id: this.nextId('fixed'), month: this.monthKey() },
    ]);
  }

  updateFixedExpense(id: string, data: Omit<FixedExpense, 'id' | 'month'>): void {
    this.fixedExpenses.update((list) => list.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }

  deleteFixedExpense(id: string): void {
    this.fixedExpenses.update((list) => list.filter((e) => e.id !== id));
  }

  togglePaid(id: string): void {
    this.fixedExpenses.update((list) => list.map((e) => (e.id === id ? { ...e, paid: !e.paid } : e)));
  }

  /** Copies the fixed expenses of the previous month into the current one. Returns the copied count. */
  copyFixedFromPreviousMonth(): number {
    const previous = new Date(this.year(), this.month() - 1, 1);
    const previousKey = toMonthKey(previous.getFullYear(), previous.getMonth());
    const source = this.fixedExpenses().filter((e) => e.month === previousKey);
    const copies = source.map((e) => ({
      ...e,
      id: this.nextId('fixed'),
      month: this.monthKey(),
      paid: false,
    }));
    this.fixedExpenses.update((list) => [...list, ...copies]);
    return copies.length;
  }

  private seed(): void {
    const categories: ExpenseCategory[] = [];
    const expenses: Expense[] = [];

    for (const seed of SEED_CATEGORIES) {
      const days = Object.entries(seed.days).map(([day, amount]) => ({ day: Number(day), amount }));
      const category: ExpenseCategory = {
        id: this.nextId('category'),
        label: seed.label,
        section: seed.section,
        linkedIngredient: seed.linkedIngredient ?? null,
        usualAmount: days.length
          ? Math.round(days.reduce((sum, d) => sum + d.amount, 0) / days.length / 100) * 100
          : 0,
      };
      categories.push(category);
      for (const { day, amount } of days) {
        expenses.push({
          id: this.nextId('expense'),
          date: new Date(2026, 9, day),
          categoryId: category.id,
          amount,
          paymentMethod: 'Espèces',
          note: '',
        });
      }
    }

    this.categories.set(categories);
    this.expenses.set(expenses);
    this.fixedExpenses.set(
      SEED_FIXED_EXPENSES.map((f) => ({ ...f, id: this.nextId('fixed'), month: '2026-10' })),
    );
  }
}
