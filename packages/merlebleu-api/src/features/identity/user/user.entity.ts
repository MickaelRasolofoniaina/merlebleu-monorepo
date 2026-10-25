import { OrderDisplayMode, User, UserRole } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';
import { ShopEntity } from '../../shop/shop.entity';

export class UserEntity implements User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  shop?: ShopEntity;
  defaultOrderDisplayMode?: OrderDisplayMode;
}

export const UserSchema = new EntitySchema<UserEntity>({
  name: 'UserEntity',
  tableName: 'users',
  target: UserEntity,
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
    email: {
      type: 'varchar',
      nullable: false,
      unique: true,
      length: 100,
    },
    password: {
      type: 'varchar',
      nullable: false,
      length: 255,
    },
    role: {
      type: 'enum',
      enum: UserRole,
      nullable: false,
      default: UserRole.CASHIER,
    },
    defaultOrderDisplayMode: {
      type: 'enum',
      enum: OrderDisplayMode,
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: () => ShopEntity,
      joinColumn: {
        name: 'shopId',
        referencedColumnName: 'id',
      },
      nullable: true,
    },
  },
});
