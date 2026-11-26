import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { CashCount, Wallet, createCashCountSchema } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import { formatDay } from '../../../treasury.model';
import { TreasuryApiService } from '../../../treasury-api.service';

/** Records the cash actually counted in a wallet. The gap is kept for follow-up, the balance is not changed. */
@Component({
  selector: 'mb-cash-count-dialog',
  templateUrl: './cash-count-dialog.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule],
})
export class CashCountDialogComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  readonly wallet = input<Wallet | null>(null);
  readonly saved = output<void>();

  protected readonly formatAmount = formatUnitPrice;
  protected readonly formatDay = formatDay;
  protected readonly counted = signal<number | null>(null);
  protected readonly date = signal<Date | null>(new Date());
  protected readonly note = signal('');
  protected readonly history = signal<CashCount[]>([]);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);

  private readonly result = computed(() =>
    createCashCountSchema.safeParse({
      walletId: this.wallet()?.id,
      date: this.date() ? formatDate(this.date()) : '',
      countedAmount: this.counted() ?? undefined,
      note: this.note() || undefined,
    }),
  );

  /** Gap against the current balance. The server recomputes it for the chosen date. */
  protected readonly gap = computed(() => {
    const wallet = this.wallet();
    const counted = this.counted();
    return wallet && counted !== null ? counted - wallet.balance : null;
  });

  constructor() {
    effect(() => {
      const wallet = this.wallet();
      if (!this.visible() || !wallet) return;
      this.submitted.set(false);
      this.counted.set(null);
      this.date.set(new Date());
      this.note.set('');
      this.history.set([]);
      this.api.listCashCounts(wallet.id).subscribe({ next: (counts) => this.history.set(counts) });
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
      .createCashCount(result.data)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (count) => {
          this.messageService.add({
            severity: count.gap === 0 ? 'success' : 'warn',
            summary: 'Pointage enregistré',
            detail: count.gap === 0 ? 'Aucun écart.' : `Écart de ${formatUnitPrice(count.gap)} Ar.`,
          });
          this.visible.set(false);
          this.saved.emit();
        },
      });
  }
}
