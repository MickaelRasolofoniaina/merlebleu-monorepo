import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import {
  DashboardAmount,
  DashboardCountPoint,
  DashboardDistributionPoint,
  DashboardQueryDto,
  DashboardView,
} from '@merlebleu/shared';
import { OrderService } from '@features/sale/order/order.service';
import { OrderCountCard } from '@shared/components/order-count-card/order-count-card';
import { formatUnitPrice } from '@shared/utils/number';
import { DashboardService } from '../dashboard.service';
import { DashboardWidget } from './components/dashboard-widget/dashboard-widget';
import { OrdersBarChart } from './components/orders-bar-chart/orders-bar-chart';
import { OrdersPieChart } from './components/orders-pie-chart/orders-pie-chart';

interface CountResult {
  view: DashboardView;
  points: DashboardCountPoint[];
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, index) =>
  new Date(2000, index, 1).toLocaleDateString('fr-FR', { month: 'short' }),
);

const YEARS_SHOWN = 6;

@Component({
  selector: 'order-dashboard',
  imports: [
    FormsModule,
    SelectModule,
    TagModule,
    OrderCountCard,
    DashboardWidget,
    OrdersBarChart,
    OrdersPieChart,
  ],
  templateUrl: './order-dashboard.html',
  styleUrl: './order-dashboard.scss',
})
export class OrderDashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly orderService = inject(OrderService);

  protected readonly toPrepareCount = signal(0);
  protected readonly toDeliverCount = signal(0);
  protected readonly lateCount = signal(0);

  protected readonly monthOptions = MONTH_LABELS.map((_, index) => {
    const name = new Date(2000, index, 1).toLocaleDateString('fr-FR', { month: 'long' });
    return { label: name.charAt(0).toUpperCase() + name.slice(1), value: index + 1 };
  });

  protected readonly yearOptions = Array.from({ length: YEARS_SHOWN }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { label: String(year), value: year };
  });

  protected readonly selectedMonth = signal(new Date().getMonth() + 1);
  protected readonly selectedYear = signal(new Date().getFullYear());

  protected readonly countView = signal(DashboardView.MONTH);
  protected readonly amountView = signal(DashboardView.MONTH);
  protected readonly typeView = signal(DashboardView.MONTH);
  protected readonly shapeView = signal(DashboardView.MONTH);

  private readonly countResult: Signal<CountResult> = this.loadOnChange(
    computed(() => this.toQuery(this.countView())),
    (query) =>
      this.dashboardService
        .getOrdersCount(query)
        .pipe(map((points) => ({ view: query.view, points }))),
    { view: DashboardView.MONTH, points: [] },
  );

  protected readonly barLabels = computed(() => {
    const { view, points } = this.countResult();
    return points.map((point) =>
      view === DashboardView.MONTH ? MONTH_LABELS[point.period - 1] : String(point.period),
    );
  });

  protected readonly barValues = computed(() => this.countResult().points.map((point) => point.count));

  protected readonly amount: Signal<DashboardAmount> = this.loadOnChange(
    computed(() => this.toQuery(this.amountView())),
    (query) => this.dashboardService.getOrdersAmount(query),
    { total: 0, ordersCount: 0 },
  );

  protected readonly typePoints: Signal<DashboardDistributionPoint[]> = this.loadOnChange(
    computed(() => this.toQuery(this.typeView())),
    (query) => this.dashboardService.getOrdersByType(query),
    [],
  );

  protected readonly shapePoints: Signal<DashboardDistributionPoint[]> = this.loadOnChange(
    computed(() => this.toQuery(this.shapeView())),
    (query) => this.dashboardService.getOrdersByShape(query),
    [],
  );

  ngOnInit(): void {
    this.orderService
      .listOrdersToPrepare({ page: 1, limit: 1 })
      .subscribe((response) => this.toPrepareCount.set(response.total));

    this.orderService
      .listOrdersToDeliver({ page: 1, limit: 1 })
      .subscribe((response) => this.toDeliverCount.set(response.total));

    this.orderService
      .listOrdersLate({ page: 1, limit: 1 })
      .subscribe((response) => this.lateCount.set(response.total));
  }

  protected formatAmount(value: number): string {
    return formatUnitPrice(value);
  }

  // the month only matters when the widget shows a single month
  private toQuery(view: DashboardView): DashboardQueryDto {
    return {
      view,
      year: this.selectedYear(),
      month: view === DashboardView.MONTH ? this.selectedMonth() : undefined,
    };
  }

  // errors are already reported by httpErrorInterceptor, so a failed request keeps the widget empty
  private loadOnChange<TParams, TResult>(
    params: Signal<TParams>,
    request: (params: TParams) => Observable<TResult>,
    initialValue: TResult,
  ): Signal<TResult> {
    return toSignal(
      toObservable(params).pipe(
        switchMap((value) => request(value).pipe(catchError(() => of(initialValue)))),
      ),
      { initialValue },
    );
  }
}
