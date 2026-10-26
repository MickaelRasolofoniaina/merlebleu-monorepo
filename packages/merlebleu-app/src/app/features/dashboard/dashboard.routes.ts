import { Routes } from '@angular/router';
import { OrderDashboard } from './order/order-dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'order',
    component: OrderDashboard,
  },
  {
    path: '',
    redirectTo: 'order',
    pathMatch: 'full',
  },
];
