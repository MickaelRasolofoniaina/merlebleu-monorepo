import { EntitySchema } from 'typeorm';
import { Notification, NotificationType, UserRole } from '@merlebleu/shared';
import { UserEntity } from '../identity/user/user.entity';

export class NotificationEntity implements Notification {
  id: string;
  type: NotificationType;
  orderId: string;
  customerName: string;
  actorName: string;
  targetRoles: UserRole[];
  createdAt: string;
}

export class NotificationReadEntity {
  id: string;
  notification: NotificationEntity;
  user: UserEntity;
  readAt: Date;
}

export const NotificationSchema = new EntitySchema<NotificationEntity>({
  name: 'NotificationEntity',
  tableName: 'notifications',
  target: NotificationEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    type: {
      type: 'enum',
      enum: NotificationType,
    },
    orderId: {
      type: 'uuid',
    },
    customerName: {
      type: 'varchar',
    },
    actorName: {
      type: 'varchar',
    },
    targetRoles: {
      type: 'enum',
      enum: UserRole,
      array: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});

export const NotificationReadSchema = new EntitySchema<NotificationReadEntity>({
  name: 'NotificationReadEntity',
  tableName: 'notification_reads',
  target: NotificationReadEntity,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    readAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    notification: {
      type: 'many-to-one',
      target: () => NotificationEntity,
      joinColumn: {
        name: 'notificationId',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
    user: {
      type: 'many-to-one',
      target: () => UserEntity,
      joinColumn: {
        name: 'userId',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
});
