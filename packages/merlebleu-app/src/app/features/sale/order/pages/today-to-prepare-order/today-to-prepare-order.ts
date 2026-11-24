import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
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
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { getUserShopId } from '@shared/utils/user';
import { UserPreferencesService } from '@shared/services/user-preferences.service';
import { OrderDetailDialog } from '../../components/order-detail-dialog/order-detail-dialog';
import { OrderCashTable } from '../../components/order-cash-table/order-cash-table';
import { OrderAgendaView } from '../../components/order-agenda-view/order-agenda-view';
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';

@Component({
  selector: 'today-to-prepare-order',
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    Button,
    ConfirmDialog,
    OrderDetailDialog,
    OrderCashTable,
    OrderAgendaView,
    OrderCountCard,
  ],
  templateUrl: './today-to-prepare-order.html',
  styleUrl: './today-to-prepare-order.scss',
  providers: [ConfirmationService],
})
export class TodayToPrepareOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly shopService = inject(ShopService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
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
  protected completingIds = signal<Set<string>>(new Set());
  protected selectedOrder = signal<Order | null>(null);
  protected displayOrderDetailDialog = false;

  protected filters = {
    customerName: '',
    shopId: getUserShopId(),
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

  protected loadOrders(page = 1, limit = this.rows): void {
    this.isLoading = true;

    this.orderService
      .listOrdersTodayToPrepare(
        { page, limit },
        this.filters.customerName || undefined,
        this.filters.shopId || undefined,
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
