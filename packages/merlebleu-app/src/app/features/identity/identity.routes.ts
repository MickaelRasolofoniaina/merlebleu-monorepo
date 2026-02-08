import { Routes } from '@angular/router';

export const IDENTITY_ROUTES: Routes = [
  { path: 'user', loadChildren: () => import('./user/user.routes').then((m) => m.USER_ROUTES) },
];
