import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import {
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderItemRowDto,
  OrderStatus,
  PaymentMethod,
  Shop,
} from '@merlebleu/shared';
import { OrderItemRowFilters, OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { PaymentService } from '@features/sale/payment/payment.service';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel, getOrderStatusColor } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { PastryOrderTable } from '../../components/pastry-order-table/pastry-order-table';
import { OrderCalendarView } from '../../components/order-calendar-view/order-calendar-view';
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';

const CALENDAR_VIEW = 'CALENDAR' as const;
type ToDeliverDisplayMode = OrderDisplayMode | typeof CALENDAR_VIEW;

@Component({
  selector: 'to-deliver-order',
  imports: [
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    DialogModule,
    Button,
    BadgeModule,
    DatePipe,
    DecimalPipe,
    OrderDetailDialog,
    PastryOrderTable,
    OrderCalendarView,
    OrderCountCard,
  ],
  templateUrl: './to-deliver-order.html',
  styleUrl: './to-deliver-order.scss',
})
export class ToDeliverOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly paymentService = inject(PaymentService);
  private readonly userPreferencesService = inject(UserPreferencesService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected readonly CALENDAR_VIEW = CALENDAR_VIEW;
  protected displayMode = signal<ToDeliverDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Détaillé', value: OrderDisplayMode.PASTRY },
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
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected paymentMethods = signal<PaymentMethod[]>([]);
  protected orderToDeliver = signal<Order | null>(null);
  protected displayDeliverDialog = false;
  protected deliverPaymentMethodId: string | null = null;
  protected isDelivering = false;

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

  private hasManualDisplayMode = false;

  ngOnInit(): void {
    this.shopService.getAll().subscribe((shops) => this.shops.set(shops));
    this.paymentService.getAllPaymentMethods().subscribe((paymentMethods) => {
      this.paymentMethods.set(paymentMethods);
    });

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

  protected displayedCount(): number {
    return this.displayMode() === CALENDAR_VIEW
      ? this.calendarOrders().length
      : this.totalRecords;
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

    const today = formatDate(new Date());
    const deliveryDateFrom =
      this.calendarRange.from < today ? today : this.calendarRange.from;

    const filterParams: Record<string, unknown> = {
      deliveryDateFrom,
      deliveryDateTo: this.calendarRange.to,
    };
    if (this.filters.shopId) {
      filterParams['shopId'] = this.filters.shopId;
    }

    const statuses = this.filters.orderStatus
      ? [this.filters.orderStatus as OrderStatus]
      : [OrderStatus.TODELIVER];

    this.orderService
      .listOrders({ page: 1, limit: 1000 }, filterParams)
      .pipe(
        finalize(() => {
          this.isCalendarLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.calendarOrders.set(
            response.data.filter((order) =>
              statuses.includes(order.orderStatus as OrderStatus),
            ),
          );
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

  protected onPastryViewDetail(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe((order) => {
      this.openOrderDetail(order);
    });
  }

  protected onPastryDeliver(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe((order) => {
      this.openDeliverDialog(order);
    });
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }

  protected openDeliverDialog(order: Order): void {
    this.orderToDeliver.set(order);
    this.deliverPaymentMethodId = order.paymentMethod?.id ?? null;
    this.displayDeliverDialog = true;
  }

  protected cancelDeliver(): void {
    this.displayDeliverDialog = false;
    this.orderToDeliver.set(null);
    this.deliverPaymentMethodId = null;
  }

  protected confirmDeliver(): void {
    const order = this.orderToDeliver();
    if (!order || !this.deliverPaymentMethodId) {
      return;
    }

    this.isDelivering = true;

    this.orderService
      .deliverOrder(order.id, this.deliverPaymentMethodId)
      .pipe(
        finalize(() => {
          this.isDelivering = false;
        }),
      )
      .subscribe({
        next: () => {
          this.displayDeliverDialog = false;
          this.orderToDeliver.set(null);
          this.deliverPaymentMethodId = null;
          this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
        },
      });
  }
}
