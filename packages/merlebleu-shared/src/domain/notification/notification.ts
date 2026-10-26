import { UserRole } from '../identity/user/user';

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELETED = 'ORDER_DELETED',
  ORDER_READY = 'ORDER_READY',
}

export interface Notification {
  id: string;
  type: NotificationType;
  orderId: string;
  customerName: string;
  actorName: string;
  targetRoles: UserRole[];
  createdAt: string;
}
