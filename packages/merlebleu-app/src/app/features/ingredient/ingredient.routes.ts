import { Route } from '@angular/router';

export const INGREDIENT_ROUTES: Route[] = [
  {
    path: 'category',
    loadChildren: () => import('./category/category.routes').then((m) => m.default),
  },
  {
    path: 'unit',
    loadChildren: () => import('./unit/unit.routes').then((m) => m.default),
  },
];
