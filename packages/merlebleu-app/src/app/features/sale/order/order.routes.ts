import { Routes } from '@angular/router';
import { ListOrder } from './pages/list-order/list-order';
import { ToPrepareOrder } from './pages/to-prepare-order/to-prepare-order';
import { ToDeliverOrder } from './pages/to-deliver-order/to-deliver-order';
import { LateOrder } from './pages/late-order/late-order';

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
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
