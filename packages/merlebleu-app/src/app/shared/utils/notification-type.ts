import { NotificationType } from '@merlebleu/shared';

export interface NotificationTypeMeta {
  title: string;
  icon: string;
  severity: 'success' | 'warn' | 'danger' | 'info';
  description: (customerName: string, actorName: string) => string;
}

const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  [NotificationType.ORDER_CREATED]: {
    title: 'Nouvelle commande',
    icon: 'pi pi-plus',
    severity: 'success',
    description: (customerName, actorName) =>
      `Une nouvelle commande de ${customerName} vient d'être ajoutée par ${actorName}`,
  },
  [NotificationType.ORDER_UPDATED]: {
    title: 'Commande modifiée',
    icon: 'pi pi-pencil',
    severity: 'warn',
    description: (customerName, actorName) =>
      `La commande de ${customerName} a été modifiée par ${actorName}`,
  },
  [NotificationType.ORDER_DELETED]: {
    title: 'Commande supprimée',
    icon: 'pi pi-trash',
    severity: 'danger',
    description: (customerName, actorName) =>
      `La commande de ${customerName} a été supprimée par ${actorName}`,
  },
  [NotificationType.ORDER_READY]: {
    title: 'Commande prête à livrer',
    icon: 'pi pi-check-circle',
    severity: 'info',
    description: (customerName) =>
      `La commande de ${customerName} est prête à être livrée`,
  },
};

export function getNotificationTypeMeta(
  type: NotificationType,
): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type];
}
