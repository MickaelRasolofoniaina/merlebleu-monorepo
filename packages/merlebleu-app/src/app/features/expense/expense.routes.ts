import { Route } from '@angular/router';

export const EXPENSE_ROUTES: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'grid' },
  {
    path: 'grid',
    loadComponent: () => import('./grid/expense-grid').then((m) => m.ExpenseGridComponent),
  },
  {
    path: 'list',
    loadComponent: () => import('./list/expense-list').then((m) => m.ExpenseListComponent),
  },
  {
    path: 'fixed',
    loadComponent: () => import('./fixed/fixed-expense').then((m) => m.FixedExpenseComponent),
  },
  {
    path: 'category',
    loadComponent: () =>
      import('./category/expense-category').then((m) => m.ExpenseCategoryComponent),
  },
];
