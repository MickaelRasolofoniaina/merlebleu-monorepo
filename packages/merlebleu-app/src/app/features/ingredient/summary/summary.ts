import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IngredientMonthSummary } from '@merlebleu/shared';
import { ReportGeneratorService } from '@shared/services/report-generator.service';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';
import { IngredientSummaryService } from './summary.service';

type SummaryFilter = 'all' | 'shortage' | 'depleted';

export const formatMonth = (value: Date): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;

@Component({
  selector: 'mb-summary',
  templateUrl: './summary.html',
  providers: [IngredientSummaryService],
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
})
export class SummaryComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  readonly filterOptions: { label: string; value: SummaryFilter }[] = [
    { label: 'Tous les ingrédients', value: 'all' },
    { label: 'En manque seulement', value: 'shortage' },
    { label: 'Épuisés seulement', value: 'depleted' },
  ];

  month: Date = new Date();
  filter = signal<SummaryFilter>('all');
  summary = signal<IngredientMonthSummary[]>([]);
  isLoading = signal(false);

  rows = computed(() => {
    switch (this.filter()) {
      case 'shortage':
        return this.summary().filter((row) => row.currentStock < 0);
      case 'depleted':
        return this.summary().filter((row) => row.currentStock === 0);
      default:
        return this.summary();
    }
  });

  /** Ingredients to buy: the depleted ones (stock 0) and the ones in shortage (negative stock). */
  shoppingList = computed(() =>
    this.summary()
      .filter((row) => row.currentStock <= 0)
      .map((row) => ({ ...row.ingredient, stock: row.currentStock })),
  );

  isPrinting = signal(false);

  private summaryService = inject(IngredientSummaryService);
  private reportGeneratorService = inject(ReportGeneratorService);

  ngOnInit() {
    this.fetchSummary();
  }

  onMonthChange(month: Date | null) {
    if (!month) return;
    this.month = month;
    this.fetchSummary();
  }

  shiftMonth(delta: number) {
    this.onMonthChange(new Date(this.month.getFullYear(), this.month.getMonth() + delta, 1));
  }

  fetchSummary() {
    this.isLoading.set(true);
    this.summaryService
      .getMonthSummary(formatMonth(this.month))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((summary) => this.summary.set(summary));
  }

  printShoppingList() {
    this.isPrinting.set(true);
    this.reportGeneratorService
      .generateShoppingList(this.shoppingList())
      .finally(() => this.isPrinting.set(false));
  }

  statusOf(row: IngredientMonthSummary): { label: string; severity: 'danger' | 'warn' | 'success' } {
    if (row.currentStock < 0) return { label: 'En manque', severity: 'danger' };
    if (row.currentStock === 0) return { label: 'Épuisé', severity: 'warn' };
    return { label: 'En stock', severity: 'success' };
  }
}
