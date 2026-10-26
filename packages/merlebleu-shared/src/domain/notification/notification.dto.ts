import { Notification } from './notification';

export type NotificationDto = Notification & {
  isRead: boolean;
};
