import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, EMPTY, forkJoin, switchMap, tap } from 'rxjs';
import {
  CreateExpenseCategoryDto,
  CreateFixedExpenseDto,
  Expense,
  ExpenseCategory,
  ExpenseNature,
  Ingredient,
  PaymentMethod,
  UpdateExpenseCategoryDto,
  UpdateFixedExpenseDto,
} from '@merlebleu/shared';
import { PaymentService } from '../sale/payment/payment.service';
import { ExpenseApiService } from './expense-api.service';
import { toIsoDate } from './expense.model';

/** Target of a grid cell: a category or an ingredient. */
export type CellTarget = { categoryId: string; ingredientId?: never } | { ingredientId: string; categoryId?: never };

/**
 * State shared by the three expense pages: the selected month, its expenses (fixed and variable),
 * and the reference data (categories, ingredients, payment methods). Backed by the API.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseStoreService {
  private readonly api = inject(ExpenseApiService);
  private readonly paymentService = inject(PaymentService);

  private readonly today = new Date();
  readonly year = signal(this.today.getFullYear());
  /** 0-based month, like `Date`. */
  readonly month = signal(this.today.getMonth());

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
      .format(new Date(this.year(), this.month(), 1))
      .replace(/^./, (c) => c.toUpperCase()),
  );
  readonly daysInMonth = computed(() => new Date(this.year(), this.month() + 1, 0).getDate());
  readonly previousMonthLabel = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(this.year(), this.month() - 1, 1)),
  );

  readonly categories = signal<ExpenseCategory[]>([]);
  readonly ingredients = signal<Ingredient[]>([]);
  readonly paymentMethods = signal<PaymentMethod[]>([]);

  /** Every expense of the selected month, fixed and variable. */
  readonly expenses = signal<Expense[]>([]);
  readonly previousMonthFixedExpenses = signal<Expense[]>([]);
  readonly isLoading = signal(false);

  readonly variableExpenses = computed(() => this.expenses().filter((e) => e.nature === ExpenseNature.VARIABLE));
  readonly fixedExpenses = computed(() => this.expenses().filter((e) => e.nature === ExpenseNature.FIXED));

  constructor() {
    this.api.getCategories().subscribe({ next: (categories) => this.categories.set(categories) });
    this.api.getAllIngredients().subscribe({ next: (ingredients) => this.ingredients.set(ingredients) });
    this.paymentService.getAllPaymentMethods().subscribe({ next: (methods) => this.paymentMethods.set(methods) });

    // Reload the expenses each time the month changes; a newer month cancels the pending request of the older one.
    toObservable(computed(() => ({ year: this.year(), month: this.month() })))
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(({ year, month }) => this.loadMonth(year, month)),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ expenses, previousFixed }) => {
          this.expenses.set(expenses);
          this.previousMonthFixedExpenses.set(previousFixed);
          this.isLoading.set(false);
        },
      });
  }

  changeMonth(delta: number): void {
    const date = new Date(this.year(), this.month() + delta, 1);
    this.year.set(date.getFullYear());
    this.month.set(date.getMonth());
  }

  // Variable expenses (grid cells)

  /**
   * Sets the total of one cell of the grid for a day of the selected month. An amount of 0 clears the cell.
   * The grid updates immediately; the month is reloaded if the server refuses the change.
   */
  setCell(target: CellTarget, day: number, amount: number): void {
    const date = toIsoDate(this.year(), this.month(), day);
    const isSameCell = (e: Expense) =>
      e.nature === ExpenseNature.VARIABLE &&
      e.date === date &&
      (target.categoryId ? e.category?.id === target.categoryId : e.ingredient?.id === target.ingredientId);

    const previous = this.expenses().find(isSameCell);
    this.expenses.update((list) => list.filter((e) => !isSameCell(e)));
    if (amount > 0) {
      this.expenses.update((list) => [...list, this.buildLocalCell(target, date, amount, previous)]);
    }

    this.api
      .setCell({ date, amount, ...target })
      .pipe(
        catchError(() => {
          this.reloadMonth();
          return EMPTY;
        }),
      )
      .subscribe({
        next: (saved) => {
          if (saved) {
            this.expenses.update((list) => list.map((e) => (isSameCell(e) ? saved : e)));
          }
        },
      });
  }

  // Fixed expenses

  addFixedExpense(dto: CreateFixedExpenseDto): Observable<Expense> {
    return this.api.addFixedExpense(dto).pipe(tap((expense) => this.expenses.update((list) => [...list, expense])));
  }

  updateFixedExpense(id: string, dto: UpdateFixedExpenseDto): Observable<Expense> {
    return this.api.updateFixedExpense(id, dto).pipe(tap((expense) => this.replaceExpense(expense)));
  }

  setFixedExpensePaid(expense: Expense, paid: boolean): Observable<Expense> {
    return this.api.setFixedExpensePaid(expense.id, paid).pipe(tap((saved) => this.replaceExpense(saved)));
  }

  deleteExpense(id: string): Observable<void> {
    return this.api.deleteExpense(id).pipe(tap(() => this.expenses.update((list) => list.filter((e) => e.id !== id))));
  }

  /** Copies the fixed expenses of the previous month into the selected one. Lines already present are skipped. */
  copyFixedFromPreviousMonth(): Observable<Expense[]> {
    return this.api
      .copyFixedExpensesFromPreviousMonth(this.year(), this.month() + 1)
      .pipe(tap((copies) => this.expenses.update((list) => [...list, ...copies])));
  }

  // Categories

  addCategory(dto: CreateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.api.addCategory(dto).pipe(tap((category) => this.categories.update((list) => [...list, category])));
  }

  updateCategory(id: string, dto: UpdateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.api
      .updateCategory(id, dto)
      .pipe(tap((category) => this.categories.update((list) => list.map((c) => (c.id === id ? category : c)))));
  }

  deleteCategory(id: string): Observable<void> {
    return this.api.deleteCategory(id).pipe(tap(() => this.categories.update((list) => list.filter((c) => c.id !== id))));
  }

  private loadMonth(year: number, month: number) {
    const previous = new Date(year, month - 1, 1);
    return forkJoin({
      expenses: this.api.getExpenses(year, month + 1),
      previousFixed: this.api.getExpenses(previous.getFullYear(), previous.getMonth() + 1, ExpenseNature.FIXED),
    }).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return EMPTY;
      }),
    );
  }

  private reloadMonth(): void {
    this.api.getExpenses(this.year(), this.month() + 1).subscribe({ next: (expenses) => this.expenses.set(expenses) });
  }

  private replaceExpense(expense: Expense): void {
    this.expenses.update((list) => list.map((e) => (e.id === expense.id ? expense : e)));
  }

  /** Optimistic version of a saved cell, replaced by the server's one once the request succeeds. */
  private buildLocalCell(target: CellTarget, date: string, amount: number, previous?: Expense): Expense {
    return {
      id: previous?.id ?? `pending-${date}-${target.categoryId ?? target.ingredientId}`,
      nature: ExpenseNature.VARIABLE,
      date,
      amount,
      paymentMethod: null,
      category: target.categoryId ? (this.categories().find((c) => c.id === target.categoryId) ?? null) : null,
      ingredient: target.ingredientId ? (this.ingredients().find((i) => i.id === target.ingredientId) ?? null) : null,
      fixedType: null,
      label: null,
      detail: null,
      note: null,
      paid: null,
    };
  }
}
