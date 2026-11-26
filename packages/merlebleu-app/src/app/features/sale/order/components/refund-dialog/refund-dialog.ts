import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { Order, Wallet, createRefundSchema } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import { TreasuryApiService } from '../../../../treasury/treasury-api.service';

/** Gives back the deposit of a cancelled order. By default the deposit is kept: a refund is an explicit act. */
@Component({
  selector: 'mb-refund-dialog',
  templateUrl: './refund-dialog.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule, SelectModule],
})
export class RefundDialogComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  readonly order = input<Order | null>(null);
  readonly saved = output<void>();

  protected readonly formatAmount = formatUnitPrice;
  protected readonly wallets = signal<Wallet[]>([]);
  protected readonly amount = signal<number | null>(null);
  protected readonly date = signal<Date | null>(new Date());
  protected readonly walletId = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);

  /** What the customer paid when the order was taken. */
  protected readonly deposit = computed(() => {
    const order = this.order();
    return order ? order.paidAmount - (order.balancePaidAmount ?? 0) : 0;
  });

  private readonly result = computed(() =>
    createRefundSchema.safeParse({
      orderId: this.order()?.id,
      walletId: this.walletId() ?? undefined,
      amount: this.amount() ?? undefined,
      date: this.date() ? formatDate(this.date()) : '',
      reason: this.reason() || undefined,
    }),
  );

  /** Balance of the chosen wallet before and after the refund. */
  protected readonly preview = computed(() => {
    const wallet = this.wallets().find((w) => w.id === this.walletId());
    const amount = this.amount() ?? 0;
    return wallet && amount > 0 ? { name: wallet.name, before: wallet.balance, after: wallet.balance - amount } : null;
  });

  constructor() {
    effect(() => {
      const order = this.order();
      if (!this.visible() || !order) return;
      this.submitted.set(false);
      this.amount.set(this.deposit());
      this.date.set(new Date());
      this.walletId.set(order.paymentMethod?.id ?? null);
      this.reason.set('');
      this.api.getWallets().subscribe({
        next: (summary) => this.wallets.set(summary.wallets.filter((w) => !w.archived)),
      });
    });
  }

  protected error(field: string): string | null {
    const result = this.result();
    if (!this.submitted() || result.success) return null;
    return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? null;
  }

  protected save(): void {
    this.submitted.set(true);
    const result = this.result();
    if (!result.success) return;

    this.saving.set(true);
    this.api
      .createRefund(result.data)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Remboursement enregistré' });
          this.visible.set(false);
          this.saved.emit();
        },
      });
  }
}
