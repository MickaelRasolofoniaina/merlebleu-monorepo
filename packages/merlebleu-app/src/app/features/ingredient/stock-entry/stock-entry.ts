import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CreateStockEntriesDto,
  DEFAULT_PAGE_SIZE,
  Ingredient,
  StockEntry,
  UpdateStockEntryDto,
} from '@merlebleu/shared';
import { IngredientService } from '../ingredient/ingredient.service';
import { StockEntryService } from './stock-entry.service';
import { StockEntryFormComponent } from './components/stock-entry-form/stock-entry-form.component';
import { StockEntryBatchComponent } from './components/stock-entry-batch/stock-entry-batch.component';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule, TablePageEvent } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { formatQuantity } from '@shared/utils/number';
import { capitalizeFirstLetter, pluralizeUnit } from '@shared/utils/text';
import { formatDate } from '@shared/utils/date';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-stock-entry-list',
  templateUrl: './stock-entry.html',
  providers: [StockEntryService, IngredientService],
  imports: [
    DatePipe,
    ButtonModule,
    TableModule,
    Dialog,
    InputTextModule,
    DatePickerModule,
    FormsModule,
    StockEntryFormComponent,
    StockEntryBatchComponent,
  ],
})
export class StockEntryListComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  private readonly batch = viewChild(StockEntryBatchComponent);

  entries = signal<StockEntry[]>([]);
  ingredients = signal<Ingredient[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  first = signal(0);
  rows = DEFAULT_PAGE_SIZE;

  filterEntryDate: Date | null = null;
  filterLabelContains = '';

  showEditModal = false;
  showDeleteModal = false;
  selectedEntry: StockEntry | null = null;
  editDto: UpdateStockEntryDto | null = null;

  private stockEntryService = inject(StockEntryService);
  private ingredientService = inject(IngredientService);
  private messageService = inject(MessageService);

  ngOnInit() {
    this.refreshIngredients();
    this.fetchEntries();
  }

  private refreshIngredients() {
    this.ingredientService
      .getIngredients({}, 1, 1000)
      .subscribe(({ items }) => this.ingredients.set(items));
  }

  private buildFilters() {
    return {
      entryDate: this.filterEntryDate ? formatDate(this.filterEntryDate) : undefined,
      labelContains: this.filterLabelContains || undefined,
    };
  }

  fetchEntries() {
    this.isLoading.set(true);
    this.stockEntryService
      .getStockEntries(this.buildFilters(), this.page(), this.rows)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ items, total }) => {
        this.entries.set(items);
        this.totalRecords.set(total);
      });
  }

  onSearchChange(value: string) {
    const normalized = value.trim();
    this.filterLabelContains = normalized;
    this.page.set(1);
    this.first.set(0);
    if (normalized.length > 0 && normalized.length < 3) return;
    this.fetchEntries();
  }

  onDateFilter() {
    this.page.set(1);
    this.first.set(0);
    this.fetchEntries();
  }

  onTablePage(event: TablePageEvent) {
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchEntries();
  }

  toDto(entry: StockEntry): UpdateStockEntryDto {
    return {
      entryDate: entry.entryDate,
      ingredientId: entry.ingredient.id,
      // The form edits the quantity in the unit it was typed in (bags), not the converted one
      quantity: Number(entry.enteredQuantity ?? entry.quantity),
    };
  }

  /** "3 sacs" when typed in the entry unit, otherwise the quantity in the stock unit. */
  enteredText(entry: StockEntry): string {
    if (entry.enteredQuantity != null && entry.enteredUnitLabel) {
      const quantity = Number(entry.enteredQuantity);
      return `${formatQuantity(quantity)} ${pluralizeUnit(entry.enteredUnitLabel, quantity)}`;
    }
    return this.storedText(entry);
  }

  /** Quantity added to the stock, in the stock unit ("150 000 g"). */
  storedText(entry: StockEntry): string {
    return `${formatQuantity(Number(entry.quantity))} ${entry.ingredient.unit.label}`;
  }

  isConverted(entry: StockEntry): boolean {
    return entry.enteredQuantity != null;
  }

  openEditModal(entry: StockEntry) {
    this.selectedEntry = entry;
    this.editDto = this.toDto(entry);
    this.showEditModal = true;
  }

  openDeleteModal(entry: StockEntry) {
    this.selectedEntry = entry;
    this.showDeleteModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedEntry = null;
    this.editDto = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedEntry = null;
  }

  addEntries(dto: CreateStockEntriesDto) {
    this.isSaving.set(true);
    this.stockEntryService
      .addStockEntries(dto)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (saved) => {
          const count = saved.length;
          this.messageService.add({
            severity: 'success',
            summary: 'Entrée enregistrée',
            detail: `${count} ligne${count > 1 ? 's ajoutées' : ' ajoutée'} au stock.`,
          });
          this.batch()?.reset();
          this.page.set(1);
          this.first.set(0);
          this.refreshIngredients();
          this.fetchEntries();
        },
      });
  }

  editEntry(id: string, dto: UpdateStockEntryDto) {
    this.stockEntryService.editStockEntry(id, dto).subscribe(() => {
      this.closeEditModal();
      this.refreshIngredients();
      this.fetchEntries();
    });
  }

  deleteEntry(id: string) {
    this.stockEntryService.deleteStockEntry(id).subscribe(() => {
      this.closeDeleteModal();
      this.refreshIngredients();
      this.fetchEntries();
    });
  }
}
