import { Routes } from '@angular/router';
import { AddOrder } from './pages/add-order/add-order';
import { DetailOrder } from './pages/detail-order/detail-order';
import { EditOrder } from './pages/edit-order/edit-order';
import { ListOrder } from './pages/list-order/list-order';
import { ToPrepareOrder } from './pages/to-prepare-order/to-prepare-order';
import { ToDeliverOrder } from './pages/to-deliver-order/to-deliver-order';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'add',
        component: AddOrder,
      },
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
        path: 'detail/:id',
        component: DetailOrder,
      },
      {
        path: 'edit/:id',
        component: EditOrder, // À remplacer par EditOrder lorsqu'il sera créé
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
