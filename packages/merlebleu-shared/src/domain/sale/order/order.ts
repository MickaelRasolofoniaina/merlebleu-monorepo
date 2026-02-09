import { PaymentMethod } from "../payment/payment";

export interface OrderItem {
  description: string;
  size: number;
  totalAmount: number;
  remarks?: string;
  photos?: string[];
}

export interface Order {
  orderDate: Date;
  customerName: string;
  customerPhoneNumber: string;
  customerFacebookName?: string;
  deliveryDate: Date;
  deliveryAddress: string;
  isFromFacebook: boolean;
  orderItems: OrderItem[];
  remarks?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethod;
}
