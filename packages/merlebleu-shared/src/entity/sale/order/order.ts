import { BaseEntity } from "../../shared/base";
import { PaymentMethod } from "../payment";

export class OrderItem extends BaseEntity {
  description: string;
  totalAmount: number;

  constructor(id: string, description: string, totalAmount: number) {
    super(id);
    this.description = description;
    this.totalAmount = totalAmount;
  }
}

export class Order extends BaseEntity {
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

  constructor(
    id: string,
    orderDate: Date,
    customerName: string,
    customerPhoneNumber: string,
    orderItems: OrderItem[],
    deliveryDate: Date,
    deliveryAddress: string,
    isFromFacebook: boolean,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    facebookMessageLink?: string,
    remarks?: string,
  ) {
    super(id);
    this.orderDate = orderDate;
    this.customerName = customerName;
    this.customerPhoneNumber = customerPhoneNumber;
    this.orderItems = orderItems;
    this.deliveryDate = deliveryDate;
    this.deliveryAddress = deliveryAddress;
    this.isFromFacebook = isFromFacebook;
    this.totalAmount = orderItems.reduce(
      (acc, item) => acc + item.totalAmount,
      0,
    );
    this.paidAmount = paidAmount;
    this.balanceAmount = this.totalAmount - paidAmount;
    this.facebookMessageLink = facebookMessageLink;
    this.remarks = remarks;
    this.paymentMethod = paymentMethod;
  }
}

export class CreateOrderDto extends Order {}

export class UpdateOrderDto extends Order {}
