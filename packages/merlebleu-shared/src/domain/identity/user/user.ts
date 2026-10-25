import { Shop } from '../../shop/shop';
import { OrderDisplayMode } from '../../sale/order/order';

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  PASTRY_CHEF = 'PASTRY_CHEF',
}

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  shop?: Shop;
  defaultOrderDisplayMode?: OrderDisplayMode;
}
