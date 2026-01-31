export interface OrderItem {
  description: string;
  totalAmount: number;
}

export interface Order {
  id: string;
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
}
