import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import {
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderItemRowDto,
  OrderStatus,
  Shop,
} from '@merlebleu/shared';
import { OrderItemRowFilters, OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { PastryOrderTable } from '../../components/pastry-order-table/pastry-order-table';

@Component({
  selector: 'to-deliver-order',
  imports: [
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    Button,
    BadgeModule,
    DatePipe,
    DecimalPipe,
    OrderDetailDialog,
    PastryOrderTable,
  ],
  templateUrl: './to-deliver-order.html',
  styleUrl: './to-deliver-order.scss',
})
export class ToDeliverOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly userPreferencesService = inject(UserPreferencesService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected displayMode = signal<OrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Pâtissier', value: OrderDisplayMode.PASTRY },
  ];

  protected orders = signal<Order[]>([]);
  protected orderItemRows = signal<OrderItemRowDto[]>([]);
  protected pastryFilters: OrderItemRowFilters = {};
  protected shops = signal<Shop[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
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

    this.userPreferencesService.getCurrentUser().subscribe({
      next: (user) => {
        this.displayMode.set(user.defaultOrderDisplayMode ?? OrderDisplayMode.STANDARD);
        this.loadOrders();
      },
      error: () => {
        this.loadOrders();
      },
    });
  }

  protected onDisplayModeChange(): void {
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    if (this.displayMode() === OrderDisplayMode.PASTRY) {
      this.loadOrderItemRows(page, limit);
      return;
    }

    this.isLoading = true;

    this.orderService
      .listOrdersToDeliver(
        { page, limit },
        this.filters.customerName || undefined,
        this.filters.shopId || undefined,
        (this.filters.orderStatus as OrderStatus) || undefined,
        this.filters.orderDate ? formatDate(this.filters.orderDate) : undefined,
        this.filters.deliveryDate ? formatDate(this.filters.deliveryDate) : undefined,
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

  private loadOrderItemRows(page: number, limit: number): void {
    this.isLoading = true;

    this.orderService
      .listOrderItemsToDeliver({ page, limit }, this.pastryFilters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.orderItemRows.set(response.data);
          this.totalRecords = response.total;
        },
      });
  }

  protected onPastryFilter(filters: OrderItemRowFilters): void {
    this.pastryFilters = filters;
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected onPastryReset(): void {
    this.pastryFilters = {};
    this.first = 0;
    this.loadOrders(1, this.rows);
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
}
