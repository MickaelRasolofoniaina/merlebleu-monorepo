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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
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
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';

const LATE_ORDER_STATUSES = [OrderStatus.TODO, OrderStatus.INPROGRESS, OrderStatus.TODELIVER];

@Component({
  selector: 'late-order',
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
    ConfirmDialog,
    DatePipe,
    DecimalPipe,
    OrderDetailDialog,
    PastryOrderTable,
    OrderCountCard,
  ],
  templateUrl: './late-order.html',
  styleUrl: './late-order.scss',
  providers: [ConfirmationService],
})
export class LateOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly paymentService = inject(PaymentService);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected readonly OrderStatus = OrderStatus;
  protected displayMode = signal<OrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Standard', value: OrderDisplayMode.STANDARD },
    { label: 'Détaillé', value: OrderDisplayMode.PASTRY },
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

  protected paymentMethods = signal<PaymentMethod[]>([]);
  protected orderToDeliver = signal<Order | null>(null);
  protected displayDeliverDialog = false;
  protected deliverPaymentMethodId: string | null = null;
  protected isDelivering = false;
  protected completingIds = signal<Set<string>>(new Set());

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    customerName: '',
    shopId: getUserShopId(),
    orderStatus: '',
  };

  protected statusOptions = ORDER_STATUSES.filter((s) => LATE_ORDER_STATUSES.includes(s.value)).map(
    (s) => ({
      label: s.label,
      value: s.value,
    }),
  );

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

  protected onDisplayModeChange(): void {
    this.hasManualDisplayMode = true;
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
      .listOrdersLate(
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
      .listOrderItemsLate({ page, limit }, this.pastryFilters)
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

  protected isCompleting(orderId: string): boolean {
    return this.completingIds().has(orderId);
  }

  protected onComplete(orderId: string): void {
    this.confirmationService.confirm({
      message: 'Marquer cette commande comme préparée et prête à être livrée?',
      header: 'Commande terminée',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        const ids = new Set(this.completingIds());
        ids.add(orderId);
        this.completingIds.set(ids);

        this.orderService
          .updateOrderStatus(orderId, OrderStatus.TODELIVER)
          .pipe(
            finalize(() => {
              const updatedIds = new Set(this.completingIds());
              updatedIds.delete(orderId);
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
