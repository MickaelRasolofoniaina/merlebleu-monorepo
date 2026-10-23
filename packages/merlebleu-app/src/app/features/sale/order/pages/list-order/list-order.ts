import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import {
  CreateOrderDto,
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderItemRowDto,
  OrderStatus,
  UpdateOrderDto,
} from '@merlebleu/shared';
import { OrderItemRowFilters, OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { Shop } from '@merlebleu/shared';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderFormDialog } from '../../components/order-form-dialog/order-form-dialog';
import { PastryOrderTable } from '../../components/pastry-order-table/pastry-order-table';
import { OrderCalendarView } from '../../components/order-calendar-view/order-calendar-view';

const CALENDAR_VIEW = 'CALENDAR' as const;
type ListOrderDisplayMode = OrderDisplayMode | typeof CALENDAR_VIEW;

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
    SelectButtonModule,
    OrderDetailDialog,
    OrderFormDialog,
    PastryOrderTable,
    OrderCalendarView,
  ],
  templateUrl: './list-order.html',
  styleUrl: './list-order.scss',
})
export class ListOrder implements OnInit {
  @ViewChild(OrderFormDialog) private orderFormDialog!: OrderFormDialog;

  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly userPreferencesService = inject(UserPreferencesService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected readonly CALENDAR_VIEW = CALENDAR_VIEW;
  protected displayMode = signal<ListOrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Pâtissier', value: OrderDisplayMode.PASTRY },
    { label: 'Calendrier', value: CALENDAR_VIEW },
  ];

  protected orders = signal<Order[]>([]);
  protected orderItemRows = signal<OrderItemRowDto[]>([]);
  protected pastryFilters: OrderItemRowFilters = {};
  protected calendarOrders = signal<Order[]>([]);
  protected isCalendarLoading = false;
  private calendarRange = this.getDefaultCalendarRange();
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

  private hasManualDisplayMode = false;

  ngOnInit(): void {
    this.shopService.getAll().subscribe((shops) => this.shops.set(shops));

    this.userPreferencesService.getCurrentUser().subscribe({
      next: (user) => {
        if (this.hasManualDisplayMode) {
          return;
        }
        this.displayMode.set(user.defaultOrderDisplayMode ?? OrderDisplayMode.STANDARD);
        this.loadOrders();
      },
      error: () => {
        if (!this.hasManualDisplayMode) {
          this.loadOrders();
        }
      },
    });
  }

  protected onDisplayModeChange(): void {
    this.hasManualDisplayMode = true;
    this.first = 0;
    this.loadOrders(1, this.rows);
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    if (this.displayMode() === CALENDAR_VIEW) {
      this.loadCalendarOrders();
      return;
    }

    if (this.displayMode() === OrderDisplayMode.PASTRY) {
      this.loadOrderItemRows(page, limit);
      return;
    }

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

  private loadOrderItemRows(page: number, limit: number): void {
    this.isLoading = true;

    this.orderService
      .listOrderItems({ page, limit }, this.pastryFilters)
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

  private getDefaultCalendarRange(): { from: string; to: string } {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      from: formatDate(firstDayOfMonth),
      to: formatDate(firstDayOfNextMonth),
    };
  }

  private loadCalendarOrders(): void {
    this.isCalendarLoading = true;

    const filterParams: Record<string, unknown> = {
      deliveryDateFrom: this.calendarRange.from,
      deliveryDateTo: this.calendarRange.to,
    };
    if (this.filters.shopId) {
      filterParams['shopId'] = this.filters.shopId;
    }

    this.orderService
      .listOrders({ page: 1, limit: 1000 }, filterParams)
      .pipe(
        finalize(() => {
          this.isCalendarLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.calendarOrders.set(response.data);
        },
      });
  }

  protected onCalendarRangeChange(range: { from: string; to: string }): void {
    this.calendarRange = range;
    this.loadCalendarOrders();
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

  protected onPastryViewDetail(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe((order) => {
      this.openOrderDetail(order);
    });
  }

  protected onPastryEdit(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe((order) => {
      this.openEditOrder(order);
    });
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
