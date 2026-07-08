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
  ROND = "Rond",
  COEUR = "Coeur",
  CARREE = "Carrée",
  PERSONNALISE = "Personnalisé",
}

export interface OrderItem {
  type: string;
  size: number;
  unitPrice: number;
  totalAmount: number;
  shape: Shape;
  text: string;
  decoration: string;
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
  deliveryAddress: string;
  isFromFacebook: boolean;
  orderItems: OrderItem[];
  remarks?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethod;
  shop: Shop;
  orderStatus?: OrderStatus;
}
