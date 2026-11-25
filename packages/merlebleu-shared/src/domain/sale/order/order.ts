import { PaymentMethod } from "../payment/payment";
import { Shop } from "../../shop/shop";

export enum OrderStatus {
  TODO = "TODO",
  INPROGRESS = "INPROGRESS",
  TODELIVER = "TODELIVER",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum Shape {
  RECTANGLE = "Rectangle",
  ROUND = "Rond",
  HEART = "Coeur",
  SQUARE = "Carrée",
  CUSTOM = "Personnalisé",
}

export enum OrderDisplayMode {
  STANDARD = "STANDARD",
  PASTRY = "PASTRY",
}

export interface OrderItem {
  type: string;
  size: number;
  unitPrice: number;
  totalAmount: number;
  shape: Shape;
  text?: string;
  decoration?: string;
  remarks?: string;
  photos?: string[];
}

export interface Order {
  id: string;
  orderDate: string;
  customerName: string;
  customerPhoneNumber: string;
  customerFacebookName?: string;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  deliveryAddress?: string;
  isFromFacebook: boolean;
  orderItems: OrderItem[];
  remarks?: string;
  totalAmount: number;
  deliveryFee: number;
  paidAmount: number;
  balanceAmount: number;
  /** Method used for the deposit paid when the order was taken. */
  paymentMethod: PaymentMethod;
  /** Amount collected at delivery to settle the balance (included in `paidAmount`). */
  balancePaidAmount?: number;
  /** Method used to settle the balance at delivery. */
  balancePaymentMethod?: PaymentMethod | null;
  shop: Shop;
  orderStatus?: OrderStatus;
}
