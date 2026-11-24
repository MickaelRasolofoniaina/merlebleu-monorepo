import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize } from 'rxjs';
import { Popover, PopoverModule } from 'primeng/popover';
import { BadgeModule } from 'primeng/badge';
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
  OrderStatus,
  PaymentMethod,
  Shop,
} from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { PaymentService } from '@features/sale/payment/payment.service';
import { Button } from 'primeng/button';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ORDER_STATUSES, getOrderStatusLabel } from '@shared/utils/order';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderCashTable } from '../../components/order-cash-table/order-cash-table';
import { OrderAgendaView } from '../../components/order-agenda-view/order-agenda-view';
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';

const LATE_ORDER_STATUSES = [OrderStatus.TODO, OrderStatus.INPROGRESS, OrderStatus.TODELIVER];

type FilterKey = 'orderDate' | 'deliveryDate' | 'shopId' | 'orderStatus';

@Component({
  selector: 'late-order',
  imports: [
    FormsModule,
    PopoverModule,
    BadgeModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    DialogModule,
    Button,
    ConfirmDialog,
    DecimalPipe,
    OrderDetailDialog,
    OrderCashTable,
    OrderAgendaView,
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
  private readonly destroyRef = inject(DestroyRef);

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
  protected itemsCount = signal(0);
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

  protected draft = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    orderStatus: '',
    shopId: getUserShopId(),
  };

  private readonly searchChange$ = new Subject<void>();

  private hasManualDisplayMode = false;

  ngOnInit(): void {
    this.searchChange$
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
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

  // the card counts order lines (items), not parent orders
  private loadItemsCount(): void {
    this.orderService
      .listOrderItemsLate({ page: 1, limit: 1 })
      .subscribe((response) => this.itemsCount.set(response.total));
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.loadItemsCount();

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

  protected get activeChips(): { key: FilterKey; label: string }[] {
    const chips: { key: FilterKey; label: string }[] = [];
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

  protected removeFilter(key: FilterKey): void {
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

  protected onComplete(orderId: string): void {
    this.confirmationService.confirm({
      message: 'Marquer cette commande comme préparée et prête à être livrée?',
      header: 'Commande terminée',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonProps: { severity: 'contrast' },
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
