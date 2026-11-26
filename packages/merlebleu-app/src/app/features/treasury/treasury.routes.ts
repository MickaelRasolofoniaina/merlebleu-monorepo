import { Route } from '@angular/router';

export const TREASURY_ROUTES: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'wallets' },
  {
    path: 'wallets',
    loadComponent: () => import('./wallet/wallet-list').then((m) => m.WalletListComponent),
  },
  {
    path: 'receipts',
    loadComponent: () => import('./receipt/receipt').then((m) => m.ReceiptComponent),
  },
  {
    path: 'closings',
    loadComponent: () => import('./closing/closing-list').then((m) => m.ClosingListComponent),
  },
  {
    path: 'movements',
    loadComponent: () => import('./movement/movement').then((m) => m.MovementComponent),
  },
];
