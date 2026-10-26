import { Component, Signal, computed, inject, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'orders-bar-chart',
  imports: [ChartModule],
  templateUrl: './orders-bar-chart.html',
})
export class OrdersBarChart {
  private readonly themeService = inject(ThemeService);

  labels = input.required<string[]>();
  values = input.required<number[]>();

  protected readonly data: Signal<ChartData<'bar'>> = computed(() => ({
    labels: this.labels(),
    datasets: [
      {
        label: 'Commandes',
        data: this.values(),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        maxBarThickness: 64,
      },
    ],
  }));

  // Chart.js colors are set in JS, so they follow the theme signal
  protected readonly options: Signal<ChartOptions<'bar'>> = computed(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)';

    return {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: {
          ticks: { color: textColor, precision: 0 },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
    };
  });
}
