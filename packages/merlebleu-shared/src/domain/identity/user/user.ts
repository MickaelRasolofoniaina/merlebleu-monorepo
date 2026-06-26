import { Shop } from '../../shop/shop';

export interface User {
  name: string;
  email: string;
  password: string;
  shop?: Shop;
}
