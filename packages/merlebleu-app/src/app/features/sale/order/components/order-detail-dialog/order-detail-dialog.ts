import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { Order, OrderStatus } from '@merlebleu/shared';
import { getOrderStatusColor, getOrderStatusLabel } from '@shared/utils/order';

@Component({
  selector: 'order-detail-dialog',
  imports: [CommonModule, BadgeModule, DialogModule],
  templateUrl: './order-detail-dialog.html',
  styleUrl: './order-detail-dialog.scss',
  providers: [DecimalPipe],
})
export class OrderDetailDialog {
  order = input<Order | null>(null);
  visible = model(false);

  protected formatPaymentMethod(): string {
    return this.order()?.paymentMethod?.name ?? '-';
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }

  protected getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected getStatus(orderStatus: OrderStatus | undefined): string {
    return getOrderStatusLabel(orderStatus);
  }

  protected getStatusColor(
    orderStatus: OrderStatus | undefined,
  ): 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    return getOrderStatusColor(orderStatus);
  }
}
