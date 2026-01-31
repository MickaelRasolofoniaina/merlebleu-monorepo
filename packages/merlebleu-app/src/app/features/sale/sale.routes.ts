import { Routes } from '@angular/router';

export const SALE_ROUTES: Routes = [
  {
    path: 'order',
    loadChildren: () => import('./order/order.routes').then((m) => m.ORDER_ROUTES),
  },
  // Ajouter d'autres routes de la feature vente ici
];
