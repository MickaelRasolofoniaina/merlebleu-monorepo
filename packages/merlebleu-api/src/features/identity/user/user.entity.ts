import { User } from '@merlebleu/shared';
import { EntitySchema } from 'typeorm';

export class UserEntity implements User {
  id: string;
  name: string;
  email: string;
  password: string;
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
  },
});
