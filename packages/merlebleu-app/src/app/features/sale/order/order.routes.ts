import { Routes } from '@angular/router';
import { AddOrder } from './pages/add-order/add-order';

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
        component: AddOrder, // À remplacer par ListeCommande lorsqu'il sera créé
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
