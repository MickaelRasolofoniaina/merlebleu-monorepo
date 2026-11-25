import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateExpenseCategoryDto,
  CreateFixedExpenseDto,
  Expense,
  ExpenseCategory,
  ExpenseNature,
  Ingredient,
  ResultPaged,
  SetExpenseCellDto,
  UpdateExpenseCategoryDto,
  UpdateFixedExpenseDto,
} from '@merlebleu/shared';
import { environment } from '@merlebleu/app/environments/environment';

/** Upper bound used to load every ingredient at once: the grid needs one row per ingredient. */
const ALL_INGREDIENTS_LIMIT = 1000;

@Injectable({ providedIn: 'root' })
export class ExpenseApiService {
  private readonly http = inject(HttpClient);
  private readonly expenseUrl = `${environment.apiBaseUrl}/expense`;
  private readonly categoryUrl = `${environment.apiBaseUrl}/expense-category`;
  private readonly ingredientUrl = `${environment.apiBaseUrl}/ingredient`;

  /** Month is 1-12. */
  getExpenses(year: number, month: number, nature?: ExpenseNature): Observable<Expense[]> {
    let params = new HttpParams().set('year', year).set('month', month);
    if (nature) params = params.set('nature', nature);
    return this.http.get<Expense[]>(this.expenseUrl, { params });
  }

  setCell(dto: SetExpenseCellDto): Observable<Expense | null> {
    return this.http.put<Expense | null>(`${this.expenseUrl}/cell`, dto);
  }

  addFixedExpense(dto: CreateFixedExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(`${this.expenseUrl}/fixed`, dto);
  }

  updateFixedExpense(id: string, dto: UpdateFixedExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.expenseUrl}/fixed/${id}`, dto);
  }

  setFixedExpensePaid(id: string, paid: boolean): Observable<Expense> {
    return this.http.patch<Expense>(`${this.expenseUrl}/fixed/${id}/paid`, { paid });
  }

  /** Month is 1-12: the month to copy into. */
  copyFixedExpensesFromPreviousMonth(year: number, month: number): Observable<Expense[]> {
    return this.http.post<Expense[]>(`${this.expenseUrl}/fixed/copy-previous-month`, { year, month });
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.expenseUrl}/${id}`);
  }

  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(this.categoryUrl);
  }

  addCategory(dto: CreateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.http.post<ExpenseCategory>(this.categoryUrl, dto);
  }

  updateCategory(id: string, dto: UpdateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.http.put<ExpenseCategory>(`${this.categoryUrl}/${id}`, dto);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.categoryUrl}/${id}`);
  }

  getAllIngredients(): Observable<Ingredient[]> {
    const params = new HttpParams().set('page', 1).set('limit', ALL_INGREDIENTS_LIMIT);
    return this.http
      .get<ResultPaged<Ingredient>>(this.ingredientUrl, { params })
      .pipe(map(({ data }) => data));
  }
}
