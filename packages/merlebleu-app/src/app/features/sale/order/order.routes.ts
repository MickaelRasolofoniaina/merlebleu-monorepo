import { Routes } from '@angular/router';
import { AddOrder } from './pages/add-order/add-order';
import { DetailOrder } from './pages/detail-order/detail-order';
import { EditOrder } from './pages/edit-order/edit-order';
import { ListOrder } from './pages/list-order/list-order';

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
