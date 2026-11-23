import { Routes } from '@angular/router';
import { ListOrder } from './pages/list-order/list-order';
import { ToPrepareOrder } from './pages/to-prepare-order/to-prepare-order';
import { ToDeliverOrder } from './pages/to-deliver-order/to-deliver-order';
import { LateOrder } from './pages/late-order/late-order';
import { TodayToPrepareOrder } from './pages/today-to-prepare-order/today-to-prepare-order';
import { TodayToDeliverOrder } from './pages/today-to-deliver-order/today-to-deliver-order';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: ListOrder,
      },
      {
        path: 'to-prepare',
        component: ToPrepareOrder,
      },
      {
        path: 'to-deliver',
        component: ToDeliverOrder,
      },
      {
        path: 'late',
        component: LateOrder,
      },
      {
        path: 'today/to-prepare',
        component: TodayToPrepareOrder,
      },
      {
        path: 'today/to-deliver',
        component: TodayToDeliverOrder,
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
