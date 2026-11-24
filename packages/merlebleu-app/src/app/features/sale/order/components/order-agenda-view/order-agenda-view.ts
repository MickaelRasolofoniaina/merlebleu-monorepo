import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { Order, OrderStatus } from '@merlebleu/shared';
import {
  getDeliveryPriorityColor,
  getDeliveryPriorityLabel,
  getOrderStatusColor,
  getOrderStatusLabel,
  isOrderLate,
} from '@shared/utils/order';

interface AgendaGroup {
  key: string;
  title: string;
  subtitle: string;
  isLate: boolean;
  orders: Order[];
  itemCount: number;
}

const LATE_GROUP_KEY = 'late';

@Component({
  selector: 'order-agenda-view',
  imports: [CommonModule, BadgeModule],
  templateUrl: './order-agenda-view.html',
  styleUrl: './order-agenda-view.scss',
})
export class OrderAgendaView {
  orders = input<Order[]>([]);
  loading = input(false);

  viewDetail = output<Order>();

  protected groups = computed<AgendaGroup[]>(() => {
    const lateOrders = this.orders().filter((order) => isOrderLate(order));
    const lateIds = new Set(lateOrders.map((order) => order.id));
    const groups: AgendaGroup[] = [];

    if (lateOrders.length) {
      groups.push(this.buildGroup(LATE_GROUP_KEY, 'En retard', 'à traiter en priorité', true, lateOrders));
    }

    const byDate = new Map<string, Order[]>();
    for (const order of this.orders()) {
      if (lateIds.has(order.id)) {
        continue;
      }
      byDate.set(order.deliveryDate, [...(byDate.get(order.deliveryDate) ?? []), order]);
    }

    for (const [date, orders] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      groups.push(this.buildGroup(date, this.getDayTitle(date), this.getDaySubtitle(date), false, orders));
    }

    return groups;
  });

  protected getStatus(status: OrderStatus | undefined): string {
    return getOrderStatusLabel(status);
  }

  protected getStatusColor(status: OrderStatus | undefined) {
    return getOrderStatusColor(status);
  }

  protected getTime(order: Order): string {
    const start = order.deliveryStartTime.slice(0, 5);
    const end = order.deliveryEndTime.slice(0, 5);
    return start === end ? start : `${start}-${end}`;
  }

  protected getPriorityLabel(order: Order): string {
    return getDeliveryPriorityLabel(order.deliveryDate);
  }

  protected getPriorityColor(order: Order) {
    return getDeliveryPriorityColor(order.deliveryDate);
  }

  private buildGroup(
    key: string,
    title: string,
    subtitle: string,
    isLate: boolean,
    orders: Order[],
  ): AgendaGroup {
    return {
      key,
      title,
      subtitle,
      isLate,
      orders,
      itemCount: orders.reduce((sum, order) => sum + order.orderItems.length, 0),
    };
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private getDayDiff(date: string): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((this.parseDate(date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  private getDayTitle(date: string): string {
    const diff = this.getDayDiff(date);
    if (diff === 0) {
      return "Aujourd'hui";
    }
    if (diff === 1) {
      return 'Demain';
    }
    const label = this.parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private getDaySubtitle(date: string): string {
    return this.parseDate(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }
}
