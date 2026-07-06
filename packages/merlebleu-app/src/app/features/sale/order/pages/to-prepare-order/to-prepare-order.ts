import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Button } from 'primeng/button';
import { DEFAULT_PAGE_SIZE, Order, Shop } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { getPageFromFirstRows } from '@shared/utils/pagination';

@Component({
  selector: 'to-prepare-order',
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, SelectModule, Button],
  templateUrl: './to-prepare-order.html',
  styleUrl: './to-prepare-order.scss',
})
export class ToPrepareOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  protected orders = signal<Order[]>([]);
  protected shops = signal<Shop[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;

  protected filters = {
    customerName: '',
    shopId: '',
  };

  ngOnInit(): void {
    this.shopService.getAll().subscribe((shops) => this.shops.set(shops));
    this.loadOrders();
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.isLoading = true;

    this.orderService
      .listOrdersToPrepare(
        { page, limit },
        this.filters.customerName || undefined,
        this.filters.shopId || undefined,
      )
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
      shopId: '',
    };
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected goToOrderDetail(order: Order): void {
    const orderId = (order as { id?: string }).id;

    if (!orderId) {
      return;
    }

    this.router.navigate(['/sale/order/detail', orderId]);
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }
}
