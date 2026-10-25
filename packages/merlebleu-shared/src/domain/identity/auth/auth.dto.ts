import { Shop } from '../../shop/shop';

export interface LoginResponseDto {
  accessToken: string;
  name: string;
  shop?: Shop;
}
