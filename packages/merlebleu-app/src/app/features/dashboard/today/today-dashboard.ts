import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { catchError, of } from 'rxjs';
import {
  DashboardTodayDetails,
  DashboardTodayExpense,
  DashboardTodaySummary,
  OrderStatus,
} from '@merlebleu/shared';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { formatUnitPrice } from '@shared/utils/number';
import { getOrderStatusColor, getOrderStatusLabel } from '@shared/utils/order';
import { DashboardService } from '../dashboard.service';

const EMPTY_SUMMARY: DashboardTodaySummary = {
  createdCount: 0,
  toPrepareCount: 0,
  toDeliverCount: 0,
  deliveredCount: 0,
  collectedAmount: 0,
};

const EMPTY_DETAILS: DashboardTodayDetails = {
  lateCount: 0,
  lateBalanceAmount: 0,
  balanceToCollectToday: 0,
  deliveries: [],
  production: [],
  customizedOrdersCount: 0,
  collectionsByMethod: [],
  expenses: [],
  unpaidFixedExpensesCount: 0,
  tomorrowDeliveriesCount: 0,
};

const EXPENSE_ORIGIN_LABELS: Record<DashboardTodayExpense['origin'], string> = {
  CATEGORY: 'catégorie',
  INGREDIENT: 'ingrédient',
  FIXED: 'charge fixe',
};

@Component({
  selector: 'today-dashboard',
  imports: [CardModule, TagModule, RouterLink, StatCard],
  templateUrl: './today-dashboard.html',
})
export class TodayDashboard {
  private readonly dashboardService = inject(DashboardService);

  protected readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // errors are already reported by httpErrorInterceptor, so a failed request keeps the page empty
  protected readonly summary = toSignal(
    this.dashboardService.getTodaySummary().pipe(catchError(() => of(EMPTY_SUMMARY))),
    { initialValue: EMPTY_SUMMARY },
  );

  protected readonly details = toSignal(
    this.dashboardService.getTodayDetails().pipe(catchError(() => of(EMPTY_DETAILS))),
    { initialValue: EMPTY_DETAILS },
  );

  protected readonly expensesTotal = computed(() =>
    this.details().expenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  protected readonly expensesUnpaidTotal = computed(() =>
    this.details()
      .expenses.filter((expense) => !expense.paid)
      .reduce((sum, expense) => sum + expense.amount, 0),
  );

  // the day balance only counts the expenses that were actually paid
  protected readonly dayBalance = computed(
    () => this.summary().collectedAmount - (this.expensesTotal() - this.expensesUnpaidTotal()),
  );

  protected readonly collectionsTotal = computed(() =>
    this.details().collectionsByMethod.reduce((sum, row) => sum + row.amount, 0),
  );

  protected readonly productionTotal = computed(() =>
    this.details().production.reduce((sum, line) => sum + line.count, 0),
  );

  protected formatAmount(value: number): string {
    return formatUnitPrice(value);
  }

  protected formatSignedAmount(value: number): string {
    return `${value > 0 ? '+' : ''}${formatUnitPrice(value)}`;
  }

  protected percentOf(amount: number, total: number): number {
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  }

  protected statusLabel(status: string): string {
    return getOrderStatusLabel(status as OrderStatus);
  }

  protected statusSeverity(status: string) {
    return getOrderStatusColor(status as OrderStatus);
  }

  protected originLabel(origin: DashboardTodayExpense['origin']): string {
    return EXPENSE_ORIGIN_LABELS[origin];
  }
}
