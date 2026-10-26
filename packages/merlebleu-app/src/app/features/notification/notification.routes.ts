import { Route } from '@angular/router';

export const NOTIFICATION_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./list/list-notification').then((m) => m.ListNotificationComponent),
  },
];
