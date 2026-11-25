import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import {
  DEFAULT_PAGE_SIZE,
  Order,
  OrderDisplayMode,
  OrderStatus,
  Shop,
} from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ShopService } from '@features/shop/shop-list/shop.service';
import { formatDate } from '@shared/utils/date';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderCashTable } from '../../components/order-cash-table/order-cash-table';
import { OrderAgendaView } from '../../components/order-agenda-view/order-agenda-view';
import { OrderCalendarView } from '../../components/order-calendar-view/order-calendar-view';
import { StatCard } from '@shared/components/stat-card/stat-card';

const CALENDAR_VIEW = 'CALENDAR' as const;
type ToPrepareDisplayMode = OrderDisplayMode | typeof CALENDAR_VIEW;

@Component({
  selector: 'to-prepare-order',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    Button,
    ConfirmDialog,
    OrderDetailDialog,
    OrderCashTable,
    OrderAgendaView,
    OrderCalendarView,
    StatCard,
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
  private readonly userPreferencesService = inject(UserPreferencesService);

  protected readonly OrderDisplayMode = OrderDisplayMode;
  protected readonly CALENDAR_VIEW = CALENDAR_VIEW;
  protected displayMode = signal<ToPrepareDisplayMode>(OrderDisplayMode.STANDARD);
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
  protected itemsCount = signal(0);
  protected rows = DEFAULT_PAGE_SIZE;
  protected first = 0;
  protected completingIds = signal<Set<string>>(new Set());
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected filters = {
    orderDate: null as Date | null,
    deliveryDate: null as Date | null,
    customerName: '',
    shopId: getUserShopId(),
    orderStatus: '',
  };

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

  // the card counts order lines (items), not parent orders
  private loadItemsCount(): void {
    this.orderService
      .listOrderItemsToPrepare({ page: 1, limit: 1 })
      .subscribe((response) => this.itemsCount.set(response.total));
  }

  protected loadOrders(page = 1, limit = this.rows): void {
    this.loadItemsCount();

    if (this.displayMode() === CALENDAR_VIEW) {
      this.loadCalendarOrders();
      return;
    }

    this.isLoading = true;

    this.orderService
      .listOrdersToPrepare(
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

    const now = new Date();
    const dayAfterTomorrow = formatDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
    );
    const deliveryDateFrom =
      this.calendarRange.from < dayAfterTomorrow ? dayAfterTomorrow : this.calendarRange.from;

    const filterParams: Record<string, unknown> = {
      deliveryDateFrom,
      deliveryDateTo: this.calendarRange.to,
    };
    if (this.filters.shopId) {
      filterParams['shopId'] = this.filters.shopId;
    }

    const statuses = [OrderStatus.TODO];

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
}
