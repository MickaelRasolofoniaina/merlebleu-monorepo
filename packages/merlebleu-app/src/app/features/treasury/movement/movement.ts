import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject, debounceTime, finalize } from 'rxjs';
import { MovementPage, MovementType, Wallet } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import {
  MOVEMENT_TYPE_OPTIONS,
  formatDay,
  formatSigned,
  getMovementTypeLabel,
  getMovementTypeSeverity,
} from '../treasury.model';
import { TreasuryApiService } from '../treasury-api.service';

const PAGE_SIZE = 20;
const ALL_WALLETS = null;
const NO_WALLET = 'none';

@Component({
  selector: 'mb-movement',
  templateUrl: './movement.html',
  imports: [FormsModule, ButtonModule, DatePickerModule, InputTextModule, MessageModule, SelectModule, TableModule, TagModule],
})
export class MovementComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly formatAmount = formatUnitPrice;
  protected readonly formatDay = formatDay;
  protected readonly formatSigned = formatSigned;
  protected readonly getTypeLabel = getMovementTypeLabel;
  protected readonly getTypeSeverity = getMovementTypeSeverity;
  protected readonly typeOptions = MOVEMENT_TYPE_OPTIONS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly MovementType = MovementType;

  protected readonly wallets = signal<Wallet[]>([]);
  protected readonly walletOptions = computed(() => [
    { label: 'Tous les portefeuilles', value: ALL_WALLETS },
    ...this.wallets().map((w) => ({ label: w.archived ? `${w.name} (archivé)` : w.name, value: w.id as string | null })),
    { label: 'Non défini', value: NO_WALLET as string | null },
  ]);

  protected readonly walletId = signal<string | null>(this.route.snapshot.queryParamMap.get('walletId'));
  protected readonly type = signal<MovementType | null>(null);
  protected readonly range = signal<(Date | null)[] | null>(monthRange());
  protected readonly search = signal('');
  protected readonly first = signal(0);

  protected readonly page = signal<MovementPage | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly exporting = signal(false);

  /** The running balance only makes sense for a single wallet. */
  protected readonly showRunningBalance = computed(() => Boolean(this.walletId()) && this.walletId() !== NO_WALLET);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.api.getWallets().subscribe({ next: (summary) => this.wallets.set(summary.wallets) });
    this.search$.pipe(debounceTime(300)).subscribe((value) => {
      this.search.set(value);
      this.applyFilters();
    });
  }

  protected onSearch(value: string): void {
    this.search$.next(value);
  }

  protected applyFilters(): void {
    this.first.set(0);
    this.load();
  }

  protected resetFilters(): void {
    this.walletId.set(null);
    this.type.set(null);
    this.range.set(monthRange());
    this.search.set('');
    this.applyFilters();
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0);
    this.load();
  }

  protected reload(): void {
    this.load();
  }

  protected exportCsv(): void {
    this.exporting.set(true);
    this.api
      .exportMovements(this.query())
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `mouvements-${formatDate(new Date())}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        },
      });
  }

  private query() {
    const [from, to] = this.range() ?? [];
    return {
      walletId: this.walletId() ?? undefined,
      type: this.type() ?? undefined,
      from: from ? formatDate(from) : undefined,
      // an incomplete range (only the first click) is treated as a single day
      to: to ? formatDate(to) : from ? formatDate(from) : undefined,
      search: this.search().trim() || undefined,
    };
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .listMovements({ ...this.query(), page: Math.floor(this.first() / PAGE_SIZE) + 1, limit: PAGE_SIZE })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.page.set(page),
        // the error itself is shown by httpErrorInterceptor
        error: () => this.failed.set(true),
      });
  }
}

/** First to last day of the current month. */
function monthRange(): Date[] {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
}
