import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'sale',
    loadChildren: () => import('./features/sale/sale.routes').then((m) => m.SALE_ROUTES),
  },
  {
    path: '',
    redirectTo: '/sale',
    pathMatch: 'full',
  },
];
