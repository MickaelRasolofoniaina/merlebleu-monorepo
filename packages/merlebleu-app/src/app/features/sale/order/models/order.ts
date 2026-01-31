import { BelongsToShop } from '@shared/models/base';

export interface Order extends BelongsToShop {
  orderDate: Date;
  customer: string;
  contact: string;
  description: string;
  deliveryDate: Date;
  deliveryAddress: string;
  isFromFacebook: boolean;
  facebookAccount?: string;
  status: 'toDo' | 'toDeliver' | 'delivered' | 'cancelled';
  remarks?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}
