import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import {
  CreateOrderDto,
  DEFAULT_PAGE_SIZE,
  Order,
  OrderStatus,
  UpdateOrderDto,
} from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { Shop } from '@merlebleu/shared';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderFormDialog } from '../../components/order-form-dialog/order-form-dialog';

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
    OrderDetailDialog,
    OrderFormDialog,
  ],
  templateUrl: './list-order.html',
  styleUrl: './list-order.scss',
})
export class ListOrder implements OnInit {
  @ViewChild(OrderFormDialog) private orderFormDialog!: OrderFormDialog;

  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);

  protected orders = signal<Order[]>([]);
  protected shops = signal<Shop[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    customerName: '',
    orderStatus: '',
    shopId: getUserShopId(),
  };

  protected statusOptions = ORDER_STATUSES.map((s) => ({
    label: s.label,
    value: s.value,
  }));

  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected editingOrderId: string | null = null;
  protected editingOrder?: UpdateOrderDto;
  protected isFormLoading = false;
  protected displayOrderFormDialog = false;

  ngOnInit(): void {
    this.shopService.getAll().subscribe((shops) => this.shops.set(shops));
    this.loadOrders();
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.isLoading = true;

    const filterParams: Record<string, unknown> = {};
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
    if (this.filters.shopId) {
      filterParams['shopId'] = this.filters.shopId;
    }

    this.orderService
      .listOrders({ page, limit }, filterParams)
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
      shopId: getUserShopId(),
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

  protected openOrderDetail(order: Order): void {
    this.selectedOrder.set(order);
    this.displayOrderDetailDialog = true;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
  }

  protected openAddOrder(): void {
    this.editingOrderId = null;
    this.editingOrder = undefined;
    this.displayOrderFormDialog = true;
  }

  protected openEditOrder(order: Order): void {
    this.editingOrderId = order.id;
    this.editingOrder = {
      ...order,
      paymentMethodId: order.paymentMethod?.id ?? '',
      shopId: order.shop?.id ?? '',
    } as UpdateOrderDto;
    this.displayOrderFormDialog = true;
  }

  protected handleOrderSubmit(order: CreateOrderDto | UpdateOrderDto): void {
    this.isFormLoading = true;
    const isEditing = !!this.editingOrderId;

    const request = isEditing
      ? this.orderService.updateOrder(this.editingOrderId!, order as UpdateOrderDto)
      : this.orderService.addOrder(order as CreateOrderDto);

    request
      .pipe(
        finalize(() => {
          this.isFormLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.displayOrderFormDialog = false;
          if (!isEditing) {
            this.orderFormDialog.resetForm();
          }
          this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
        },
      });
  }
}
