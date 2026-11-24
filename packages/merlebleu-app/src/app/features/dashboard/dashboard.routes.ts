import { Routes } from '@angular/router';
import { OrderDashboard } from './order/order-dashboard';
import { TodayDashboard } from './today/today-dashboard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'order',
    component: OrderDashboard,
  },
  {
    path: 'today',
    component: TodayDashboard,
  },
  {
    path: '',
    redirectTo: 'order',
    pathMatch: 'full',
  },
];
