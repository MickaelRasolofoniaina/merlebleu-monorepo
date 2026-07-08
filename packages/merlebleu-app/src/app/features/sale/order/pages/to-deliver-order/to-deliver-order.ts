import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DEFAULT_PAGE_SIZE, Order, OrderStatus } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';

@Component({
  selector: 'to-deliver-order',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    Button,
    BadgeModule,
    OrderDetailDialog,
  ],
  templateUrl: './to-deliver-order.html',
  styleUrl: './to-deliver-order.scss',
})
export class ToDeliverOrder implements OnInit {
  private readonly orderService = inject(OrderService);

  protected orders = signal<Order[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected filters = {
    customerName: '',
  };

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.isLoading = true;

    this.orderService
      .listOrdersToDeliver({ page, limit }, this.filters.customerName || undefined)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
          this.totalRecords = response.total;
        },
      });
  }

  protected onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadOrders(getPageFromFirstRows(event.first, event.rows), event.rows);
  }

  protected applyFilters(): void {
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected resetFilters(): void {
    this.filters = {
      customerName: '',
    };
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected openOrderDetail(order: Order): void {
    this.selectedOrder.set(order);
    this.displayOrderDetailDialog = true;
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }
}
