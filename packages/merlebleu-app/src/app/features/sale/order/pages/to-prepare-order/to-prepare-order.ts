import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DEFAULT_PAGE_SIZE, Order, OrderStatus, Shop } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';

@Component({
  selector: 'to-prepare-order',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    Button,
    BadgeModule,
    ConfirmDialog,
    OrderDetailDialog,
  ],
  templateUrl: './to-prepare-order.html',
  styleUrl: './to-prepare-order.scss',
  providers: [ConfirmationService],
})
export class ToPrepareOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected orders = signal<Order[]>([]);
  protected shops = signal<Shop[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;
  protected completingIds = signal<Set<string>>(new Set());
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected filters = {
    customerName: '',
    shopId: getUserShopId(),
    orderStatus: '',
  };

  protected statusOptions = ORDER_STATUSES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

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
        (this.filters.orderStatus as OrderStatus) || undefined,
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
      shopId: getUserShopId(),
      orderStatus: '',
    };
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected openOrderDetail(order: Order): void {
    this.selectedOrder.set(order);
    this.displayOrderDetailDialog = true;
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }

  protected isCompleting(order: Order): boolean {
    return this.completingIds().has(order.id);
  }

  protected isOrderCompleted(order: Order): boolean {
    return order.orderStatus === OrderStatus.TODELIVER;
  }

  protected onComplete(order: Order): void {
    this.confirmationService.confirm({
      message: 'Marquer la commande comme terminée?',
      header: 'Terminer la commande',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        const ids = new Set(this.completingIds());
        ids.add(order.id);
        this.completingIds.set(ids);

        this.orderService
          .updateOrderStatus(order.id, OrderStatus.TODELIVER)
          .pipe(
            finalize(() => {
              const updatedIds = new Set(this.completingIds());
              updatedIds.delete(order.id);
              this.completingIds.set(updatedIds);
            }),
          )
          .subscribe({
            next: () => {
              this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
              this.messageService.add({
                severity: 'success',
                summary: 'Commande terminée',
                detail: 'La commande est prête à être livrée.',
                life: 3000,
              });
            },
          });
      },
    });
  }
}
