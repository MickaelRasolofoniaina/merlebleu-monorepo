import { Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { ClosingPreview, createClosingSchema } from '@merlebleu/shared';
import { addDays, formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import { formatDay, parseDay } from '../../../treasury.model';
import { TreasuryApiService } from '../../../treasury-api.service';

type Step = 'count' | 'confirm';

/**
 * Closes the cash in two steps: count the wallets (optional), then confirm.
 * A closing freezes the balance of every wallet and locks the movements up to its date.
 */
@Component({
  selector: 'mb-closing-dialog',
  templateUrl: './closing-dialog.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, MessageModule, SkeletonModule],
})
export class ClosingDialogComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly messageService = inject(MessageService);

  readonly visible = model(false);
  /** YYYY-MM-DD, the new closing has to be after it. */
  readonly lastClosingDate = input<string | null>(null);
  /** YYYY-MM-DD proposed as the closing date, today when empty. */
  readonly initialDate = input<string | null>(null);
  readonly saved = output<void>();

  protected readonly formatAmount = formatUnitPrice;
  protected readonly formatDay = formatDay;
  protected readonly today = new Date();

  protected readonly step = signal<Step>('count');
  protected readonly date = signal<Date | null>(null);
  protected readonly preview = signal<ClosingPreview | null>(null);
  protected readonly loadingPreview = signal(false);
  protected readonly previewFailed = signal(false);
  /** Counted amount by wallet id, a missing or empty entry means "not counted". */
  protected readonly counted = signal<Record<string, number | null>>({});
  protected readonly saving = signal(false);

  protected readonly minDate = computed(() => {
    const last = this.lastClosingDate();
    return last ? addDays(parseDay(last), 1) : null;
  });

  protected readonly rows = computed(() =>
    (this.preview()?.wallets ?? []).map((wallet) => {
      const counted = this.counted()[wallet.walletId] ?? null;
      return {
        ...wallet,
        counted,
        frozen: counted ?? wallet.calculatedAmount,
        gap: counted === null ? null : counted - wallet.calculatedAmount,
      };
    }),
  );
  protected readonly totalFrozen = computed(() => this.rows().reduce((sum, row) => sum + row.frozen, 0));
  protected readonly totalGap = computed(() => this.rows().reduce((sum, row) => sum + (row.gap ?? 0), 0));
  protected readonly negativeRows = computed(() => this.rows().filter((row) => row.calculatedAmount < 0));
  protected readonly dateLabel = computed(() => {
    const date = this.date();
    return date ? formatDay(formatDate(date)) : '';
  });

  private previewRequest = 0;

  constructor() {
    // every opening starts again from the first step, on the most useful date
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        this.step.set('count');
        this.counted.set({});
        this.date.set(this.defaultDate());
      });
    });

    // the balances depend on the date: load them again whenever it changes
    effect(() => {
      const date = this.date();
      if (!this.visible() || !date) return;
      untracked(() => this.loadPreview(date));
    });
  }

  protected setCounted(walletId: string, amount: number | null): void {
    this.counted.update((counted) => ({ ...counted, [walletId]: amount }));
  }

  protected next(): void {
    if (this.preview()) this.step.set('confirm');
  }

  protected back(): void {
    this.step.set('count');
  }

  protected confirm(): void {
    const preview = this.preview();
    const date = this.date();
    if (!preview || !date) return;

    const result = createClosingSchema.safeParse({
      date: formatDate(date),
      counts: preview.wallets.map((wallet) => ({
        walletId: wallet.walletId,
        calculatedAmount: wallet.calculatedAmount,
        countedAmount: this.counted()[wallet.walletId] ?? null,
      })),
    });
    if (!result.success) return;

    this.saving.set(true);
    this.api
      .createClosing(result.data)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Caisse clôturée',
            detail: `Les soldes sont figés au ${this.dateLabel()}.`,
          });
          this.visible.set(false);
          this.saved.emit();
        },
        // the error itself is shown by httpErrorInterceptor (e.g. a balance changed since the preview)
        error: () => {
          this.step.set('count');
          this.loadPreview(date);
        },
      });
  }

  /** Today, so the balances match the ones on the wallets, unless another date was asked for and is still allowed. */
  private defaultDate(): Date {
    const initial = this.initialDate();
    const wanted = initial ? parseDay(initial) : this.today;
    const min = this.minDate();
    return min && wanted < min ? this.today : wanted;
  }

  private loadPreview(date: Date): void {
    const request = ++this.previewRequest;
    this.loadingPreview.set(true);
    this.previewFailed.set(false);
    this.preview.set(null);
    this.counted.set({});

    this.api
      .previewClosing(formatDate(date))
      .pipe(
        finalize(() => {
          if (request === this.previewRequest) this.loadingPreview.set(false);
        }),
      )
      .subscribe({
        next: (preview) => {
          if (request === this.previewRequest) this.preview.set(preview);
        },
        // the error itself is shown by httpErrorInterceptor, the dialog only needs to disable the next step
        error: () => {
          if (request === this.previewRequest) this.previewFailed.set(true);
        },
      });
  }
}
