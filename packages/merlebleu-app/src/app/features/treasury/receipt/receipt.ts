import { Component, Signal, computed, effect, inject, signal } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { finalize, EMPTY, catchError } from 'rxjs';
import { ReceiptPeriod, ReceiptSummary, WalletSummary } from '@merlebleu/shared';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { ThemeService } from '@shared/services/theme.service';
import { formatDate } from '@shared/utils/date';
import { formatUnitPrice } from '@shared/utils/number';
import { RECEIPT_COLORS } from '../treasury.model';
import { TreasuryApiService } from '../treasury-api.service';

const PERIOD_OPTIONS = [
  { label: 'Jour', value: ReceiptPeriod.DAY },
  { label: 'Mois', value: ReceiptPeriod.MONTH },
  { label: 'Année', value: ReceiptPeriod.YEAR },
];

const CHART_TITLES: Record<ReceiptPeriod, string> = {
  [ReceiptPeriod.DAY]: 'Entrées du jour',
  [ReceiptPeriod.MONTH]: 'Recettes nettes par jour',
  [ReceiptPeriod.YEAR]: 'Recettes nettes par mois',
};

type ReceiptView = 'chart' | 'table';

const VIEW_OPTIONS: { label: string; value: ReceiptView }[] = [
  { label: 'Graphique', value: 'chart' },
  { label: 'Tableau', value: 'table' },
];

interface ReceiptRow {
  label: string;
  income: number;
  refunds: number;
  outflow: number;
  net: number;
  isEmpty: boolean;
  isToday: boolean;
}

@Component({
  selector: 'mb-receipt',
  templateUrl: './receipt.html',
  imports: [FormsModule, ButtonModule, ChartModule, MessageModule, SelectButtonModule, SkeletonModule, TableModule, StatCard],
})
export class ReceiptComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly themeService = inject(ThemeService);

  protected readonly formatAmount = formatUnitPrice;
  protected readonly periodOptions = PERIOD_OPTIONS;
  protected readonly viewOptions = VIEW_OPTIONS;

  protected readonly period = signal<ReceiptPeriod>(ReceiptPeriod.MONTH);
  protected readonly anchor = signal(new Date());
  protected readonly summary = signal<ReceiptSummary | null>(null);
  protected readonly balances = signal<WalletSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly periodLabel = computed(() => {
    const date = this.anchor();
    switch (this.period()) {
      case ReceiptPeriod.DAY:
        return capitalize(
          date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        );
      case ReceiptPeriod.MONTH:
        return capitalize(date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
      case ReceiptPeriod.YEAR:
        return `Année ${date.getFullYear()}`;
    }
  });

  // the table lists days (month) or months (year); a day already lists one entry per order in the chart
  protected readonly view = signal<ReceiptView>('chart');
  protected readonly hasTable = computed(() => this.period() !== ReceiptPeriod.DAY);
  protected readonly activeView = computed<ReceiptView>(() => (this.hasTable() ? this.view() : 'chart'));
  protected readonly firstColumnLabel = computed(() => (this.period() === ReceiptPeriod.YEAR ? 'Mois' : 'Jour'));

  protected readonly rows: Signal<ReceiptRow[]> = computed(() => {
    const isMonth = this.period() === ReceiptPeriod.MONTH;
    const today = formatDate(new Date());
    return (this.summary()?.points ?? []).map((point) => ({
      label: isMonth ? formatDayLabel(point.date) : point.label,
      income: point.income,
      refunds: point.refunds,
      outflow: point.outflow,
      net: point.net,
      isEmpty: point.income === 0 && point.refunds === 0 && point.outflow === 0,
      isToday: isMonth && point.date === today,
    }));
  });

  protected readonly chartTitle = computed(() => CHART_TITLES[this.period()]);
  protected readonly isCurrentPeriod = computed(() => {
    const now = new Date();
    const date = this.anchor();
    switch (this.period()) {
      case ReceiptPeriod.DAY:
        return formatDate(now) === formatDate(date);
      case ReceiptPeriod.MONTH:
        return now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth();
      case ReceiptPeriod.YEAR:
        return now.getFullYear() === date.getFullYear();
    }
  });

  protected readonly activeBalances = computed(() => this.balances()?.wallets.filter((w) => !w.archived) ?? []);

  protected readonly chartData: Signal<ChartData<'bar'>> = computed(() => {
    const points = this.summary()?.points ?? [];
    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: 'Recettes (Ar)',
          data: points.map((point) => point.amount),
          backgroundColor: points.map((point) => (point.amount < 0 ? RECEIPT_COLORS.negative : RECEIPT_COLORS.positive)),
          borderRadius: 4,
          maxBarThickness: 48,
        },
      ],
    };
  });

  // Chart.js colors are set in JS, so they follow the theme signal
  protected readonly chartOptions: Signal<ChartOptions<'bar'>> = computed(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)';
    return {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
      },
    };
  });

  constructor() {
    effect(() => this.load(this.period(), this.anchor()));
    this.api.getWallets().subscribe({ next: (balances) => this.balances.set(balances) });
  }

  protected setPeriod(period: ReceiptPeriod | null): void {
    if (period) this.period.set(period);
  }

  protected setView(view: ReceiptView | null): void {
    if (view) this.view.set(view);
  }

  protected shift(direction: -1 | 1): void {
    const date = new Date(this.anchor());
    switch (this.period()) {
      case ReceiptPeriod.DAY:
        date.setDate(date.getDate() + direction);
        break;
      case ReceiptPeriod.MONTH:
        date.setDate(1);
        date.setMonth(date.getMonth() + direction);
        break;
      case ReceiptPeriod.YEAR:
        date.setDate(1);
        date.setFullYear(date.getFullYear() + direction);
        break;
    }
    this.anchor.set(date);
  }

  protected goToCurrent(): void {
    this.anchor.set(new Date());
  }

  protected reload(): void {
    this.load(this.period(), this.anchor());
  }

  private load(period: ReceiptPeriod, anchor: Date): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .getReceipts({ period, date: formatDate(anchor) })
      .pipe(
        // the error itself is shown by httpErrorInterceptor, the page only needs to show its error state
        catchError(() => {
          this.failed.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
      });
  }
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

// YYYY-MM-DD is parsed as a local date: `new Date('2026-11-03')` would be UTC and could shift the day
const formatDayLabel = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return capitalize(
    new Date(year, month - 1, day).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
  );
};
