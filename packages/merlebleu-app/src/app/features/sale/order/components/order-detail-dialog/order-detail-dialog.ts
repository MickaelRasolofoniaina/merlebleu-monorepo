import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { Order } from '@merlebleu/shared';

@Component({
  selector: 'order-detail-dialog',
  imports: [CommonModule, PanelModule, DialogModule],
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
}
