import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Order } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { Button } from 'primeng/button';

@Component({
  selector: 'list-order',
  imports: [CommonModule, TableModule, Button],
  templateUrl: './list-order.html',
  styleUrl: './list-order.scss',
})
export class ListOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected orders = signal<Order[]>([]);
  protected isLoading = false;

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = 1, limit = 20): void {
    this.isLoading = true;

    this.orderService
      .listOrders(page, limit)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
        },
      });
  }

  protected getFirstDescription(order: Order): string {
    const description = order.orderItems?.[0]?.description ?? '';

    if (!description) {
      return '-';
    }

    return this.truncate(description, 60);
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

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
  }
}
