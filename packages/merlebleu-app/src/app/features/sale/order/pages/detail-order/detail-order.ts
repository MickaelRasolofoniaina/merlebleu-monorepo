import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PanelModule } from 'primeng/panel';
import { Order } from '@merlebleu/shared';
import { OrderService } from '../../order.service';

@Component({
  selector: 'detail-order',
  imports: [CommonModule, RouterLink, PanelModule],
  templateUrl: './detail-order.html',
  styleUrl: './detail-order.scss',
})
export class DetailOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  protected order?: Order;
  protected isLoading = false;

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
