import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { catchError, of } from 'rxjs';
import { DashboardTodaySummary } from '@merlebleu/shared';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { formatUnitPrice } from '@shared/utils/number';
import { DashboardService } from '../dashboard.service';

const EMPTY_SUMMARY: DashboardTodaySummary = {
  createdCount: 0,
  toPrepareCount: 0,
  toDeliverCount: 0,
  deliveredCount: 0,
  collectedAmount: 0,
};

@Component({
  selector: 'today-dashboard',
  imports: [CardModule, StatCard],
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

  protected formatAmount(value: number): string {
    return formatUnitPrice(value);
  }
}
