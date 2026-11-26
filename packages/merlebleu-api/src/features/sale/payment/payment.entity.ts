import { EntitySchema } from 'typeorm';
import { DEFAULT_PAYMENT_METHOD_COLOR, PaymentMethod } from '@merlebleu/shared';

export class PaymentMethodEntity implements PaymentMethod {
  id: string;
  name: string;
  color: string;
  openingBalance: number;
  openingDate: string | null;
  archived: boolean;
}

export const PaymentMethodSchema = new EntitySchema<PaymentMethodEntity>({
  name: 'PaymentMethodEntity',
  tableName: 'payment_methods',
  target: PaymentMethodEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      nullable: false,
      length: 100,
    },
    color: {
      type: 'varchar',
      nullable: false,
      length: 7,
      default: DEFAULT_PAYMENT_METHOD_COLOR,
    },
    openingBalance: {
      type: 'integer',
      default: 0,
    },
    openingDate: {
      type: 'date',
      nullable: true,
    },
    archived: {
      type: 'boolean',
      default: false,
    },
  },
});
