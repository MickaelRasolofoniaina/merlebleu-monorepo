import { Component, Signal, computed, inject, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { DashboardDistributionPoint } from '@merlebleu/shared';
import { ThemeService } from '@shared/services/theme.service';
import { groupSmallSlices } from '../../dashboard-chart.utils';

const PIE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

@Component({
  selector: 'orders-pie-chart',
  imports: [ChartModule],
  templateUrl: './orders-pie-chart.html',
})
export class OrdersPieChart {
  private readonly themeService = inject(ThemeService);

  points = input.required<DashboardDistributionPoint[]>();

  private readonly slices = computed(() => groupSmallSlices(this.points()));

  protected readonly hasData = computed(() => this.slices().length > 0);

  protected readonly data: Signal<ChartData<'pie'>> = computed(() => {
    const slices = this.slices();
    const total = slices.reduce((sum, slice) => sum + slice.count, 0);

    return {
      labels: slices.map(
        (slice) => `${slice.label} (${Math.round((slice.count / total) * 100)} %)`,
      ),
      datasets: [
        {
          data: slices.map((slice) => slice.count),
          backgroundColor: slices.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]),
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly options: Signal<ChartOptions<'pie'>> = computed(() => ({
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: this.themeService.isDarkMode() ? '#cbd5e1' : '#475569',
          usePointStyle: true,
        },
      },
    },
  }));
}
