import { EntitySchema } from 'typeorm';
import { PaymentMethod } from '@merlebleu/shared';

export class PaymentMethodEntity implements PaymentMethod {
  id: string;
  name: string;
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
  },
});
