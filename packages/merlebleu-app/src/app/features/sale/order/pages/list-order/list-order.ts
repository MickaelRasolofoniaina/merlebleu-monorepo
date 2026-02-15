import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Order, OrderStatus } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';

@Component({
  selector: 'list-order',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    BadgeModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './list-order.html',
  styleUrl: './list-order.scss',
})
export class ListOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected orders = signal<Order[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = 20;
  protected first = 0;

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    customerName: '',
    orderStatus: '',
  };

  protected statusOptions = ORDER_STATUSES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.isLoading = true;

    const filterParams: Record<string, unknown> = {};
    console.log('Filters:', this.filters);
    if (this.filters.orderDate) {
      filterParams['orderDate'] = formatDate(this.filters.orderDate);
    }
    if (this.filters.deliveryDate) {
      filterParams['deliveryDate'] = formatDate(this.filters.deliveryDate);
    }
    if (this.filters.customerName) {
      filterParams['customerName'] = this.filters.customerName;
    }
    if (this.filters.orderStatus) {
      filterParams['status'] = this.filters.orderStatus;
    }

    this.orderService
      .listOrders(page, limit, filterParams)
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
      orderDate: null,
      deliveryDate: null,
      customerName: '',
      orderStatus: '',
    };
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }

  protected getDescription(order: Order): string {
    const description = order?.orderItems?.map((item) => item.description).join(' + ') ?? '';

    if (!description) {
      return '-';
    }

    return this.truncate(description, 20);
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
  }

  protected goToAddOrder(): void {
    this.router.navigate(['/sale/order/add']);
  }

  protected goToOrderDetail(order: Order): void {
    const orderId = (order as { id?: string }).id;

    if (!orderId) {
      return;
    }

    this.router.navigate(['/sale/order/detail', orderId]);
  }

  protected goToEditOrder(order: Order): void {
    const orderId = (order as { id?: string }).id;

    if (!orderId) {
      return;
    }

    this.router.navigate(['/sale/order/edit', orderId]);
  }
}
