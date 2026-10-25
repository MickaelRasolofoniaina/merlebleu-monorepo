import { OrderStatus } from '@merlebleu/shared';

export interface OrderStatusConfig {
  index: number;
  value: OrderStatus;
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeSeverity: 'info' | 'success' | 'warn' | 'danger' | 'contrast';
}

export const ORDER_STATUSES: OrderStatusConfig[] = [
  {
    index: 0,
    value: OrderStatus.TODO,
    label: 'À faire',
    icon: 'pi pi-clock',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
    badgeSeverity: 'danger',
  },
  {
    index: 1,
    value: OrderStatus.INPROGRESS,
    label: 'En cours',
    icon: 'pi pi-spinner',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    badgeSeverity: 'info',
  },
  {
    index: 2,
    value: OrderStatus.TODELIVER,
    label: 'À livrer',
    icon: 'pi pi-truck',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-500',
    badgeSeverity: 'success',
  },
  {
    index: 3,
    value: OrderStatus.DELIVERED,
    label: 'Livré',
    icon: 'pi pi-check-circle',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
    badgeSeverity: 'info',
  },
  {
    index: 4,
    value: OrderStatus.CANCELLED,
    label: 'Annulé',
    icon: 'pi pi-times-circle',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
    badgeSeverity: 'warn',
  },
];

export function getOrderStatusLabel(orderStatus: OrderStatus | undefined): string {
  if (!orderStatus) {
    return '-';
  }

  const statusConfig = ORDER_STATUSES.find((s) => s.value === orderStatus);
  return statusConfig?.label ?? '-';
}

export function getOrderStatusColor(
  orderStatus: OrderStatus | undefined,
): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
  if (!orderStatus) {
    return 'contrast';
  }

  const statusConfig = ORDER_STATUSES.find((s) => s.value === orderStatus);
  return statusConfig?.badgeSeverity ?? 'contrast';
}

export function getOrderStatusConfig(
  orderStatus: OrderStatus | undefined,
): OrderStatusConfig | undefined {
  if (!orderStatus) {
    return undefined;
  }

  return ORDER_STATUSES.find((s) => s.value === orderStatus);
}

function getDeliveryDayDiff(deliveryDate: string): number {
  const [year, month, day] = deliveryDate.split('-').map(Number);
  const deliveryUtc = Date.UTC(year, month - 1, day);

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((deliveryUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

export interface DeliveryPriorityConfig {
  label: string;
  description: string;
  severity: 'danger' | 'warn' | 'info';
  maxDayDiff: number;
}

export const DELIVERY_PRIORITIES: DeliveryPriorityConfig[] = [
  {
    label: 'Urgent',
    description: 'Livraison aujourd’hui ou demain',
    severity: 'danger',
    maxDayDiff: 1,
  },
  {
    label: 'Bientôt',
    description: 'Livraison dans 2 à 3 jours',
    severity: 'warn',
    maxDayDiff: 3,
  },
  {
    label: 'Plus tard',
    description: 'Livraison dans plus de 3 jours',
    severity: 'info',
    maxDayDiff: Infinity,
  },
];

function getDeliveryPriorityConfig(deliveryDate: string): DeliveryPriorityConfig {
  const dayDiff = getDeliveryDayDiff(deliveryDate);

  return (
    DELIVERY_PRIORITIES.find((priority) => dayDiff <= priority.maxDayDiff) ??
    DELIVERY_PRIORITIES[DELIVERY_PRIORITIES.length - 1]
  );
}

export function getDeliveryPriorityLabel(deliveryDate: string): string {
  return getDeliveryPriorityConfig(deliveryDate).label;
}

export function getDeliveryPriorityColor(
  deliveryDate: string,
): 'danger' | 'warn' | 'info' {
  return getDeliveryPriorityConfig(deliveryDate).severity;
}
