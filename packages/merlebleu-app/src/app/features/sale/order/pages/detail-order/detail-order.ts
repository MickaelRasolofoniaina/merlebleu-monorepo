import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Order, OrderStatus } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ORDER_STATUSES } from '@shared/utils/order';

@Component({
  selector: 'detail-order',
  imports: [CommonModule, RouterLink, PanelModule, ButtonModule],
  templateUrl: './detail-order.html',
  styleUrl: './detail-order.scss',
})
export class DetailOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly messageService = inject(MessageService);

  protected order?: Order;
  protected isLoading = false;
  protected isUpdatingStatus = false;

  protected readonly orderStatuses = ORDER_STATUSES;

  protected get activeStepIndex(): number {
    if (!this.order) return 0;
    return this.orderStatuses.findIndex((s) => s.value === this.order?.orderStatus) ?? 0;
  }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  protected formatPaymentMethod(): string {
    return this.order?.paymentMethod?.name ?? '-';
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }

  protected onStepChange(index: number): void {
    if (!this.order || this.isUpdatingStatus) return;

    const newStatus = this.orderStatuses[index]?.value;
    if (!newStatus || newStatus === this.order.orderStatus) return;

    this.isUpdatingStatus = true;

    this.orderService
      .updateOrderStatus(this.order.id, newStatus)
      .pipe(
        finalize(() => {
          this.isUpdatingStatus = false;
        }),
      )
      .subscribe({
        next: (updatedOrder) => {
          this.order = updatedOrder;
          this.messageService.add({
            severity: 'success',
            summary: 'Statut mis a jour',
            detail: `Le statut de la commande a ete change a "${this.orderStatuses[index].label}".`,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de mettre a jour le statut de la commande.',
          });
        },
      });
  }

  private loadOrder(orderId: string): void {
    this.isLoading = true;

    this.orderService
      .getOrderById(orderId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (order) => {
          this.order = order;
        },
      });
  }
}
