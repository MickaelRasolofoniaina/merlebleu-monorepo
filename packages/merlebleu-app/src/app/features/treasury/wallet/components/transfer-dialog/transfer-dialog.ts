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
import { Wallet, createTransferSchema } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import { TreasuryApiService } from '../../../treasury-api.service';

/** Moves money from one wallet to another. A transfer is neither a receipt nor an expense. */
@Component({
  selector: 'mb-transfer-dialog',
  templateUrl: './transfer-dialog.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule, SelectModule],
})
export class TransferDialogComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  /** Active wallets the money can move between. */
  readonly wallets = input<Wallet[]>([]);
  /** Wallet preselected as the source. */
  readonly sourceId = input<string | null>(null);
  readonly saved = output<void>();

  protected readonly formatAmount = formatUnitPrice;
  protected readonly fromId = signal<string | null>(null);
  protected readonly toId = signal<string | null>(null);
  protected readonly amount = signal<number | null>(null);
  protected readonly date = signal<Date | null>(new Date());
  protected readonly note = signal('');
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);

  private readonly result = computed(() =>
    createTransferSchema.safeParse({
      fromWalletId: this.fromId() ?? undefined,
      toWalletId: this.toId() ?? undefined,
      amount: this.amount() ?? undefined,
      date: this.date() ? formatDate(this.date()) : '',
      note: this.note() || undefined,
    }),
  );

  protected readonly errors = computed(() => {
    const result = this.result();
    const errors = new Map<string, string>();
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors.has(field)) errors.set(field, issue.message);
      }
    }
    return errors;
  });

  /** Balances of both wallets before and after the transfer, shown as a preview. */
  protected readonly preview = computed(() => {
    const from = this.wallets().find((w) => w.id === this.fromId());
    const to = this.wallets().find((w) => w.id === this.toId());
    const amount = this.amount() ?? 0;
    if (!from || !to || amount <= 0) return null;
    return [
      { name: from.name, before: from.balance, after: from.balance - amount },
      { name: to.name, before: to.balance, after: to.balance + amount },
    ];
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      this.submitted.set(false);
      this.fromId.set(this.sourceId());
      this.toId.set(null);
      this.amount.set(null);
      this.date.set(new Date());
      this.note.set('');
    });
  }

  protected error(field: string): string | null {
    return this.submitted() ? (this.errors().get(field) ?? null) : null;
  }

  protected save(): void {
    this.submitted.set(true);
    const result = this.result();
    if (!result.success) return;

    this.saving.set(true);
    this.api
      .createTransfer(result.data)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Virement enregistré' });
          this.visible.set(false);
          this.saved.emit();
        },
      });
  }
}
