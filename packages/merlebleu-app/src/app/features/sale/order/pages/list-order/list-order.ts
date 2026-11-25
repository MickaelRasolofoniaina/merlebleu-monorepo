import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize } from 'rxjs';
import { Popover, PopoverModule } from 'primeng/popover';
import {
  CreateOrderDto,
  DashboardOrderListSummary,
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderStatus,
  PaymentMethod,
  UpdateOrderDto,
} from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { DashboardService } from '@features/dashboard/dashboard.service';
import { formatUnitPrice } from '@shared/utils/number';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { PaymentService } from '@features/sale/payment/payment.service';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import {
  ORDER_STATUSES,
  getOrderStatusLabel,
  getOrderStatusColor,
  isOrderLate,
} from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { Shop } from '@merlebleu/shared';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderFormDialog } from '../../components/order-form-dialog/order-form-dialog';
import { OrderCashTable } from '../../components/order-cash-table/order-cash-table';
import { OrderAgendaView } from '../../components/order-agenda-view/order-agenda-view';
import { OrderCalendarView } from '../../components/order-calendar-view/order-calendar-view';
import { StatCard } from '@shared/components/stat-card/stat-card';

const CALENDAR_VIEW = 'CALENDAR' as const;
type ListOrderDisplayMode = OrderDisplayMode | typeof CALENDAR_VIEW;

@Component({
  selector: 'list-order',
  imports: [
    CommonModule,
    FormsModule,
    PopoverModule,
    Button,
    CheckboxModule,
    BadgeModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    SelectButtonModule,
    DialogModule,
    OrderDetailDialog,
    OrderFormDialog,
    OrderCashTable,
    OrderCalendarView,
    OrderAgendaView,
    StatCard,
  ],
  templateUrl: './list-order.html',
  styleUrl: './list-order.scss',
})
export class ListOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly paymentService = inject(PaymentService);
  private readonly dashboardService = inject(DashboardService);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected readonly CALENDAR_VIEW = CALENDAR_VIEW;
  protected displayMode = signal<ListOrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Liste', icon: 'pi pi-list', value: OrderDisplayMode.STANDARD },
    { label: 'Carte', icon: 'pi pi-table', value: OrderDisplayMode.PASTRY },
    { label: 'Calendrier', icon: 'pi pi-calendar', value: CALENDAR_VIEW },
  ];

  protected orders = signal<Order[]>([]);
  protected calendarOrders = signal<Order[]>([]);
  protected isCalendarLoading = false;
  private calendarRange = this.getDefaultCalendarRange();
  protected shops = signal<Shop[]>([]);
  protected isLoading = false;
  protected totalRecords = 0;
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;
  protected toPrepareCount = signal(0);
  protected toDeliverCount = signal(0);
  protected lateCount = signal(0);
  protected orderListSummary = signal<DashboardOrderListSummary>({
    balanceToCollect: 0,
    collectedToday: 0,
    toDeliverToday: 0,
    toDeliverThisWeek: 0,
  });
  protected readonly isOrderLate = isOrderLate;

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    customerName: '',
    orderStatus: '',
    shopId: getUserShopId(),
  };

  protected includeDelivered = false;

  protected draft = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    orderStatus: '',
    shopId: getUserShopId(),
  };

  private readonly searchChange$ = new Subject<void>();

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

  protected paymentMethods = signal<PaymentMethod[]>([]);
  protected orderToDeliver = signal<Order | null>(null);
  protected displayDeliverDialog = false;
  protected deliverPaymentMethodId: string | null = null;
  protected isDelivering = false;
  protected readonly OrderStatus = OrderStatus;

  private hasManualDisplayMode = false;

  ngOnInit(): void {
    this.searchChange$
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.shopService.getAll().subscribe((shops) => this.shops.set(shops));
    this.paymentService.getAllPaymentMethods().subscribe((paymentMethods) => {
      this.paymentMethods.set(paymentMethods);
    });
    this.loadStatusCounts();
    this.openOrderFromQueryParam();

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

  private openOrderFromQueryParam(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const orderId = params.get('orderId');
      if (!orderId) {
        return;
      }

      this.orderService.getOrderById(orderId).subscribe((order) => {
        this.openOrderDetail(order);
      });

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
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
    if (!this.includeDelivered) {
      filterParams['excludeDelivered'] = true;
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

  protected formatAmount(value: number): string {
    return `${formatUnitPrice(value)} Ar`;
  }

  private loadStatusCounts(): void {
    this.dashboardService
      .getOrderListSummary()
      .subscribe((summary) => this.orderListSummary.set(summary));

    this.orderService
      .listOrderItemsToPrepare({ page: 1, limit: 1 })
      .subscribe((response) => this.toPrepareCount.set(response.total));

    this.orderService
      .listOrderItemsToDeliver({ page: 1, limit: 1 })
      .subscribe((response) => this.toDeliverCount.set(response.total));

    this.orderService
      .listOrderItemsLate({ page: 1, limit: 1 })
      .subscribe((response) => this.lateCount.set(response.total));
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

  protected onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadOrders(getPageFromFirstRows(event.first, event.rows), event.rows);
  }

  protected onSearchChange(): void {
    this.searchChange$.next();
  }

  protected get activeFilterCount(): number {
    return this.activeChips.length;
  }

  protected get activeChips(): { key: 'orderDate' | 'deliveryDate' | 'shopId' | 'orderStatus'; label: string }[] {
    const chips: { key: 'orderDate' | 'deliveryDate' | 'shopId' | 'orderStatus'; label: string }[] = [];
    const { shopId, orderStatus, orderDate, deliveryDate } = this.filters;

    if (shopId) {
      const shop = this.shops().find((s) => s.id === shopId);
      chips.push({ key: 'shopId', label: `Boutique : ${shop?.address ?? '...'}` });
    }
    if (orderStatus) {
      chips.push({ key: 'orderStatus', label: `Statut : ${getOrderStatusLabel(orderStatus as OrderStatus)}` });
    }
    if (deliveryDate) {
      chips.push({ key: 'deliveryDate', label: `Livraison : ${deliveryDate.toLocaleDateString('fr-FR')}` });
    }
    if (orderDate) {
      chips.push({ key: 'orderDate', label: `Commande : ${orderDate.toLocaleDateString('fr-FR')}` });
    }

    return chips;
  }

  protected openFilters(popover: Popover, event: Event): void {
    this.draft = {
      orderDate: this.filters.orderDate,
      deliveryDate: this.filters.deliveryDate,
      orderStatus: this.filters.orderStatus,
      shopId: this.filters.shopId,
    };
    popover.toggle(event);
  }

  protected applyDraft(): void {
    this.filters = { ...this.filters, ...this.draft };
    this.applyFilters();
  }

  protected removeFilter(key: 'orderDate' | 'deliveryDate' | 'shopId' | 'orderStatus'): void {
    this.filters = { ...this.filters, [key]: key === 'orderStatus' ? '' : null };
    this.applyFilters();
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
    void this.router.navigate(['/sale/order/add']);
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
          this.cancelDeliver();
          this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
          this.loadStatusCounts();
        },
      });
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
          this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
          this.loadStatusCounts();
        },
      });
  }
}
