import { EntitySchema } from 'typeorm';
import { PaymentMethod } from '@merlebleu/shared';

export const PaymentMethodSchema = new EntitySchema<PaymentMethod>({
  name: 'PaymentMethod',
  tableName: 'payment_methods',
  target: PaymentMethod,
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
