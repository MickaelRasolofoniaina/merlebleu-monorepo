import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';
import {
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderStatus,
  PaymentMethod,
  Shop,
} from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { PaymentService } from '@features/sale/payment/payment.service';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderCashTable } from '../../components/order-cash-table/order-cash-table';
import { OrderAgendaView } from '../../components/order-agenda-view/order-agenda-view';
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';

@Component({
  selector: 'today-to-deliver-order',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DialogModule,
    Button,
    DecimalPipe,
    OrderDetailDialog,
    OrderCashTable,
    OrderAgendaView,
    OrderCountCard,
  ],
  templateUrl: './today-to-deliver-order.html',
  styleUrl: './today-to-deliver-order.scss',
})
export class TodayToDeliverOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly paymentService = inject(PaymentService);
  private readonly userPreferencesService = inject(UserPreferencesService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected displayMode = signal<OrderDisplayMode>(OrderDisplayMode.STANDARD);
  protected displayModeOptions = [
    { label: 'Liste', icon: 'pi pi-list', value: OrderDisplayMode.STANDARD },
    { label: 'Carte', icon: 'pi pi-table', value: OrderDisplayMode.PASTRY },
  ];

  protected orders = signal<Order[]>([]);
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
    customerName: '',
    shopId: getUserShopId(),
    orderStatus: '',
  };

  protected statusOptions = ORDER_STATUSES.filter((s) =>
    [OrderStatus.TODO, OrderStatus.TODELIVER].includes(s.value as OrderStatus),
  ).map((s) => ({
    label: s.label,
    value: s.value as OrderStatus,
  }));

  protected readonly readyCount = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly toPrepareCount = signal(0);

  private hasManualDisplayMode = false;

  private loadCounts(): void {
    const countOf = (status?: OrderStatus) =>
      this.orderService.listOrdersTodayToDeliver({ page: 1, limit: 1 }, undefined, undefined, status);

    countOf(OrderStatus.TODELIVER).subscribe((r) => this.readyCount.set(r.total));
    countOf().subscribe((r) => this.totalCount.set(r.total));
    countOf(OrderStatus.TODO).subscribe((r) => this.toPrepareCount.set(r.total));
  }

  ngOnInit(): void {
    this.loadCounts();
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
    this.isLoading = true;

    this.orderService
      .listOrdersTodayToDeliver(
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
          this.loadCounts();
          this.loadOrders(getPageFromFirstRows(this.first, this.rows), this.rows);
        },
      });
  }
}
