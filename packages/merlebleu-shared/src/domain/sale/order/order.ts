import { PaymentMethod } from "../payment/payment";

export interface OrderItem {
  description: string;
  totalAmount: number;
}

export interface Order {
  orderDate: Date;
  customerName: string;
  customerPhoneNumber: string;
  orderItems: OrderItem[];
  deliveryDate: Date;
  deliveryAddress: string;
  isFromFacebook: boolean;
  facebookMessageLink?: string;
  remarks?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethod;
}
