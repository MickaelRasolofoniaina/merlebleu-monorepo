import { Routes } from '@angular/router';

export const SALE_ROUTES: Routes = [
  {
    path: 'order',
    loadChildren: () => import('./order/order.routes').then((m) => m.ORDER_ROUTES),
  },
  {
    path: 'payment',
    loadChildren: () => import('./payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
  },
];
