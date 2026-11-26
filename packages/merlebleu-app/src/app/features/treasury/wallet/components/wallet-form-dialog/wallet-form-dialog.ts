import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { finalize, of, switchMap } from 'rxjs';
import { DEFAULT_PAYMENT_METHOD_COLOR, Wallet, updateWalletSchema } from '@merlebleu/shared';
import { formatDate, parseDate } from '@shared/utils/date';
import { PaymentService } from '../../../../sale/payment/payment.service';
import { TreasuryApiService } from '../../../treasury-api.service';

/** Creates a wallet (a payment method) or edits its name, color, opening balance and archiving. */
@Component({
  selector: 'mb-wallet-form-dialog',
  templateUrl: './wallet-form-dialog.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule, ToggleSwitchModule],
})
export class WalletFormDialogComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  /** The wallet to edit, null to create one. */
  readonly wallet = input<Wallet | null>(null);
  readonly saved = output<void>();

  protected readonly name = signal('');
  protected readonly color = signal(DEFAULT_PAYMENT_METHOD_COLOR);
  protected readonly openingBalance = signal<number | null>(0);
  protected readonly openingDate = signal<Date | null>(null);
  protected readonly archived = signal(false);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);

  private readonly result = computed(() =>
    updateWalletSchema.safeParse({
      name: this.name(),
      color: this.color(),
      openingBalance: this.openingBalance() ?? 0,
      openingDate: this.openingDate() ? formatDate(this.openingDate()) : null,
      archived: this.archived(),
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
    // the opening balance and its date are required in the form, so they show up with the other errors
    if (this.openingBalance() === null && !errors.has('openingBalance')) {
      errors.set('openingBalance', 'Le solde initial est requis');
    }
    if (!this.openingDate() && !errors.has('openingDate')) {
      errors.set('openingDate', 'La date du solde initial est requise');
    }
    return errors;
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const wallet = this.wallet();
      this.submitted.set(false);
      this.name.set(wallet?.name ?? '');
      this.color.set(wallet?.color ?? DEFAULT_PAYMENT_METHOD_COLOR);
      this.openingBalance.set(wallet?.openingBalance ?? 0);
      this.openingDate.set(parseDate(wallet?.openingDate ?? undefined));
      this.archived.set(wallet?.archived ?? false);
    });
  }

  protected error(field: string): string | null {
    return this.submitted() ? (this.errors().get(field) ?? null) : null;
  }

  protected save(): void {
    this.submitted.set(true);
    const result = this.result();
    if (!result.success || this.errors().size > 0) return;

    const dto = result.data;
    const wallet = this.wallet();
    this.saving.set(true);

    const request$ = wallet
      ? this.api.updateWallet(wallet.id, dto)
      : this.paymentService
          .addPaymentMethod({ name: dto.name, color: dto.color })
          .pipe(
            switchMap((created) =>
              created.id && (dto.openingBalance !== 0 || dto.openingDate || dto.archived)
                ? this.api.updateWallet(created.id, dto)
                : of(undefined),
            ),
          );

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: wallet ? 'Portefeuille modifié' : 'Portefeuille créé',
        });
        this.visible.set(false);
        this.saved.emit();
      },
    });
  }
}
