import { Shop } from '../../shop/shop';
import { OrderDisplayMode } from '../../sale/order/order';

export interface User {
  name: string;
  email: string;
  password: string;
  shop?: Shop;
  defaultOrderDisplayMode?: OrderDisplayMode;
}
