import { Route } from '@angular/router';

export const INGREDIENT_ROUTES: Route[] = [
  {
    path: 'ingredient',
    loadChildren: () => import('./ingredient/ingredient.routes').then((m) => m.default),
  },
  {
    path: 'unit',
    loadChildren: () => import('./unit/unit.routes').then((m) => m.default),
  },
  {
    path: 'stock-entry',
    loadChildren: () => import('./stock-entry/stock-entry.routes').then((m) => m.default),
  },
  {
    path: 'recipe',
    loadChildren: () => import('./recipe/recipe.routes').then((m) => m.default),
  },
  {
    path: 'production',
    loadChildren: () => import('./production/production.routes').then((m) => m.default),
  },
  {
    path: 'summary',
    loadChildren: () => import('./summary/summary.routes').then((m) => m.default),
  },
];
