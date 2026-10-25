import { Shop } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';

export class ShopEntity implements Shop {
  id: string;
  address: string;
}

export const ShopSchema = new EntitySchema<ShopEntity>({
  name: 'ShopEntity',
  tableName: 'shops',
  target: ShopEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    address: {
      type: 'varchar',
    },
  },
});
