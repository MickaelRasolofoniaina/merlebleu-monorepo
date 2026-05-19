import { Route } from '@angular/router';

export const INGREDIENT_ROUTES: Route[] = [
  {
    path: 'ingredient',
    loadChildren: () => import('./ingredient/ingredient.routes').then((m) => m.default),
  },
  {
    path: 'category',
    loadChildren: () => import('./category/category.routes').then((m) => m.default),
  },
  {
    path: 'unit',
    loadChildren: () => import('./unit/unit.routes').then((m) => m.default),
  },
  {
    path: 'purchase',
    loadChildren: () => import('./purchase/purchase.routes').then((m) => m.default),
  },
  {
    path: 'inventory',
    loadChildren: () => import('./inventory/inventory.routes').then((m) => m.default),
  },
];
