import { Order, OrderItem } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { PaymentMethodEntity } from '../payment/payment.entity';

export class OrderItemEntity implements OrderItem {
  id: string;
  description: string;
  size: number;
  totalAmount: number;
  remarks?: string | undefined;
  photos?: string[] | undefined;
  order?: OrderEntity;
}

export class OrderEntity implements Order {
  id: string;
  customerName: string;
  customerPhoneNumber: string;
  customerFacebookName?: string | undefined;
  deliveryDate: Date;
  deliveryAddress: string;
  isFromFacebook: boolean;
  orderItems: OrderItemEntity[];
  remarks?: string | undefined;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: PaymentMethodEntity;
  orderDate: Date;
}

// OrderItem schema
export const OrderItemSchema = new EntitySchema<OrderItemEntity>({
  name: 'OrderItemEntity',
  tableName: 'order_items',
  target: OrderItemEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    description: {
      type: 'varchar',
    },
    size: {
      type: 'int',
    },
    totalAmount: {
      type: 'decimal',
    },
    remarks: {
      type: 'varchar',
      nullable: true,
    },
    photos: {
      type: 'simple-array',
      nullable: true,
    },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: () => OrderEntity,
      joinColumn: {
        name: 'orderId',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
});

export const OrderSchema = new EntitySchema<OrderEntity>({
  name: 'OrderEntity',
  tableName: 'orders',
  target: OrderEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    customerName: {
      type: 'varchar',
    },
    customerPhoneNumber: {
      type: 'varchar',
    },
    customerFacebookName: {
      type: 'varchar',
      nullable: true,
    },
    deliveryDate: {
      type: 'timestamp',
    },
    deliveryAddress: {
      type: 'varchar',
    },
    isFromFacebook: {
      type: 'boolean',
    },
    totalAmount: {
      type: 'decimal',
    },
    paidAmount: {
      type: 'decimal',
    },
    balanceAmount: {
      type: 'decimal',
    },
    orderDate: {
      type: 'timestamp',
    },
  },
  relations: {
    orderItems: {
      type: 'one-to-many',
      target: () => OrderItemEntity,
      inverseSide: 'order',
      cascade: true,
    },
    paymentMethod: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: {
        name: 'paymentMethodId',
        referencedColumnName: 'id',
      },
    },
  },
});
