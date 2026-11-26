import { EntitySchema } from 'typeorm';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import { OrderEntity } from '../sale/order/order.entity';

export class WalletTransferEntity {
  id: string;
  fromWallet: PaymentMethodEntity;
  toWallet: PaymentMethodEntity;
  amount: number;
  date: string;
  note: string | null;
}

export const WalletTransferSchema = new EntitySchema<WalletTransferEntity>({
  name: 'WalletTransferEntity',
  tableName: 'wallet_transfers',
  target: WalletTransferEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    amount: { type: 'integer' },
    date: { type: 'date' },
    note: { type: 'varchar', length: 200, nullable: true },
  },
  relations: {
    fromWallet: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'fromWalletId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
    },
    toWallet: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'toWalletId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
    },
  },
  indices: [{ name: 'IDX_wallet_transfers_date', columns: ['date'] }],
  checks: [
    {
      name: 'CHK_wallet_transfers_distinct',
      expression: `"fromWalletId" <> "toWalletId"`,
    },
  ],
});

export class OrderRefundEntity {
  id: string;
  order: OrderEntity;
  wallet: PaymentMethodEntity;
  amount: number;
  date: string;
  reason: string | null;
}

export const OrderRefundSchema = new EntitySchema<OrderRefundEntity>({
  name: 'OrderRefundEntity',
  tableName: 'order_refunds',
  target: OrderRefundEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    amount: { type: 'integer' },
    date: { type: 'date' },
    reason: { type: 'varchar', length: 200, nullable: true },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: () => OrderEntity,
      joinColumn: { name: 'orderId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
    wallet: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'walletId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
    },
  },
  indices: [{ name: 'IDX_order_refunds_date', columns: ['date'] }],
});

export class CashCountEntity {
  id: string;
  wallet: PaymentMethodEntity;
  date: string;
  countedAmount: number;
  expectedAmount: number;
  note: string | null;
  createdAt: Date;
}

export const CashCountSchema = new EntitySchema<CashCountEntity>({
  name: 'CashCountEntity',
  tableName: 'cash_counts',
  target: CashCountEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    date: { type: 'date' },
    countedAmount: { type: 'integer' },
    expectedAmount: { type: 'integer' },
    note: { type: 'varchar', length: 200, nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    wallet: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'walletId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
  },
});

export class CashClosingEntity {
  id: string;
  /** Last day covered by the closing, YYYY-MM-DD. */
  date: string;
  createdBy: string;
  createdAt: Date;
  lines: CashClosingLineEntity[];
}

export class CashClosingLineEntity {
  id: string;
  closing: CashClosingEntity;
  wallet: PaymentMethodEntity;
  calculatedAmount: number;
  countedAmount: number | null;
  frozenAmount: number;
}

export const CashClosingSchema = new EntitySchema<CashClosingEntity>({
  name: 'CashClosingEntity',
  tableName: 'cash_closings',
  target: CashClosingEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    date: { type: 'date', unique: true },
    createdBy: { type: 'varchar', length: 100 },
    createdAt: { type: 'timestamp', createDate: true },
  },
  relations: {
    lines: {
      type: 'one-to-many',
      target: () => CashClosingLineEntity,
      inverseSide: 'closing',
      cascade: ['insert'],
    },
  },
});

export const CashClosingLineSchema = new EntitySchema<CashClosingLineEntity>({
  name: 'CashClosingLineEntity',
  tableName: 'cash_closing_lines',
  target: CashClosingLineEntity,
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    calculatedAmount: { type: 'integer' },
    countedAmount: { type: 'integer', nullable: true },
    frozenAmount: { type: 'integer' },
  },
  relations: {
    closing: {
      type: 'many-to-one',
      target: () => CashClosingEntity,
      joinColumn: { name: 'closingId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
      inverseSide: 'lines',
    },
    wallet: {
      type: 'many-to-one',
      target: () => PaymentMethodEntity,
      joinColumn: { name: 'walletId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
    },
  },
  uniques: [
    {
      name: 'UQ_cash_closing_lines_closing_wallet',
      columns: ['closing', 'wallet'],
    },
  ],
});
