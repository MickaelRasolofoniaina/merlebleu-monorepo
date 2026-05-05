import { Route } from '@angular/router';

export const INVENTORY_ROUTES: Route[] = [
  {
    path: 'item',
    loadChildren: () => import('./item/item.routes').then(m => m.default),
  },
];
