import { Routes } from '@angular/router';
import { AppLayout } from './app-layout';
import { Login } from './features/identity/login/login';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
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
        path: 'sale',
        loadChildren: () => import('./features/sale/sale.routes').then((m) => m.SALE_ROUTES),
      },
      {
        path: 'identity',
        loadChildren: () =>
          import('./features/identity/identity.routes').then((m) => m.IDENTITY_ROUTES),
      },
    ],
  },
];
