import { Routes } from '@angular/router';
import { AppLayout } from './app-layout';
import { Login } from './features/identity/login/login';
import { UserRole } from '@merlebleu/shared';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/order',
    pathMatch: 'full',
  },
  {
    path: 'identity/login',
    component: Login,
  },
  {
    path: '',
    component: AppLayout,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'sale',
        loadChildren: () => import('./features/sale/sale.routes').then((m) => m.SALE_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      },
      {
        path: 'identity',
        loadChildren: () =>
          import('./features/identity/identity.routes').then((m) => m.IDENTITY_ROUTES),
      },
      {
        path: 'ingredient',
        loadChildren: () =>
          import('./features/ingredient/ingredient.routes').then((m) => m.INGREDIENT_ROUTES),
      },
      {
        path: 'expense',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.PASTRY_CHEF] },
        loadChildren: () =>
          import('./features/expense/expense.routes').then((m) => m.EXPENSE_ROUTES),
      },
      {
        path: 'treasury',
        loadChildren: () =>
          import('./features/treasury/treasury.routes').then((m) => m.TREASURY_ROUTES),
      },
      {
        path: 'shop',
        loadChildren: () =>
          import('./features/shop/shop.routes').then((m) => m.SHOP_ROUTES),
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./features/forbidden/forbidden').then((m) => m.Forbidden),
      },
      {
        path: 'notification',
        loadChildren: () =>
          import('./features/notification/notification.routes').then(
            (m) => m.NOTIFICATION_ROUTES,
          ),
      },
    ],
  },
];
