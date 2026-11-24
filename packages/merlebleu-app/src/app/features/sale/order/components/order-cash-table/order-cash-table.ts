import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DEFAULT_PAGE_SIZE, Order, OrderStatus } from '@merlebleu/shared';
import { getOrderStatusColor, getOrderStatusLabel, isOrderLate } from '@shared/utils/order';

@Component({
  selector: 'order-cash-table',
  imports: [CommonModule, TableModule, BadgeModule, Button],
  templateUrl: './order-cash-table.html',
  styleUrl: './order-cash-table.scss',
})
export class OrderCashTable {
  orders = input<Order[]>([]);
  loading = input(false);
  totalRecords = input(0);
  first = input(0);
  pageSize = input(DEFAULT_PAGE_SIZE);
  showEditAction = input(true);
  showDeliverAction = input(true);
  showCompleteAction = input(false);
  completingOrderIds = input<Set<string>>(new Set());

  pageChange = output<{ first: number; rows: number }>();
  viewDetail = output<Order>();
  editOrder = output<Order>();
  deliver = output<Order>();
  complete = output<string>();

  protected readonly OrderStatus = OrderStatus;

  protected pageBalance = computed(() =>
    this.orders()
      .filter((order) => order.orderStatus !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.balanceAmount, 0),
  );

  protected canComplete(order: Order): boolean {
    return (
      this.showCompleteAction() &&
      (order.orderStatus === OrderStatus.TODO || order.orderStatus === OrderStatus.INPROGRESS)
    );
  }

  protected isCompleting(orderId: string): boolean {
    return this.completingOrderIds().has(orderId);
  }

  protected isLate(order: Order): boolean {
    return isOrderLate(order);
  }

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

  protected getDayLabel(order: Order): string {
    const [year, month, day] = order.deliveryDate.split('-').map(Number);
    const now = new Date();
    const diff = Math.round(
      (Date.UTC(year, month - 1, day) -
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
        (24 * 60 * 60 * 1000),
    );
    const date = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

    if (isOrderLate(order)) {
      return `En retard · ${date}`;
    }
    if (diff === 0) {
      return "Aujourd'hui";
    }
    if (diff === 1) {
      return 'Demain';
    }
    return `${date}/${year}`;
  }

  protected onPage(event: { first?: number; rows?: number }): void {
    this.pageChange.emit({ first: event.first ?? 0, rows: event.rows ?? this.pageSize() });
  }
}
