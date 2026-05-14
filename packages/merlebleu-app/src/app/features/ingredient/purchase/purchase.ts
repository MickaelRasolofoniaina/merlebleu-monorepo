import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CreateIngredientPurchaseDto,
  DEFAULT_PAGE_SIZE,
  Ingredient,
  IngredientCategory,
  IngredientPurchase,
  UpdateIngredientPurchaseDto,
} from '@merlebleu/shared';
import { IngredientCategoryService } from '../category/category.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { IngredientPurchaseService } from './purchase.service';
import { PurchaseFormComponent } from './components/purchase-form/purchase-form.component';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule, TablePageEvent } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { formatUnitPrice } from '@shared/utils/number';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { formatDate } from '@shared/utils/date';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-purchase-list',
  templateUrl: './purchase.html',
  styleUrls: ['./purchase.scss'],
  providers: [IngredientPurchaseService, IngredientCategoryService, IngredientService],
  imports: [
    DatePipe,
    ButtonModule,
    TableModule,
    Dialog,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    FormsModule,
    PurchaseFormComponent,
  ],
})
export class PurchaseListComponent implements OnInit {
  readonly formatUnitPrice = formatUnitPrice;
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  purchases = signal<IngredientPurchase[]>([]);
  categories = signal<IngredientCategory[]>([]);
  ingredients = signal<Ingredient[]>([]);
  isLoading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  first = signal(0);
  rows = DEFAULT_PAGE_SIZE;

  filterPurchaseDate: Date | null = null;
  filterLabelContains = '';
  filterCategoryId: string | null = null;

  showModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedPurchase: IngredientPurchase | null = null;
  editDto: UpdateIngredientPurchaseDto | null = null;

  private purchaseService = inject(IngredientPurchaseService);
  private categoryService = inject(IngredientCategoryService);
  private ingredientService = inject(IngredientService);

  ngOnInit() {
    this.categoryService.getAll().subscribe((data) => this.categories.set(data));
    this.ingredientService
      .getIngredients({}, 1, 1000)
      .subscribe(({ items }) => this.ingredients.set(items));
    this.fetchPurchases();
  }

  private buildFilters() {
    return {
      purchaseDate: this.filterPurchaseDate ? formatDate(this.filterPurchaseDate) : undefined,
      labelContains: this.filterLabelContains || undefined,
      categoryId: this.filterCategoryId || undefined,
    };
  }

  fetchPurchases() {
    this.isLoading.set(true);
    this.purchaseService
      .getPurchases(this.buildFilters(), this.page(), this.rows)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ items, total }) => {
        this.purchases.set(items);
        this.totalRecords.set(total);
      });
  }

  onSearchChange(value: string) {
    const normalized = value.trim();
    this.filterLabelContains = normalized;
    this.page.set(1);
    this.first.set(0);
    if (normalized.length > 0 && normalized.length < 3) return;
    this.fetchPurchases();
  }

  onDateFilter() {
    this.page.set(1);
    this.first.set(0);
    this.fetchPurchases();
  }

  onCategoryFilter() {
    this.page.set(1);
    this.first.set(0);
    this.fetchPurchases();
  }

  onTablePage(event: TablePageEvent) {
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchPurchases();
  }

  getTotalPrice(purchase: IngredientPurchase): number {
    return Number(purchase.quantity) * purchase.ingredient.unitPrice;
  }

  toDto(purchase: IngredientPurchase): UpdateIngredientPurchaseDto {
    return {
      purchaseDate: new Date(purchase.purchaseDate) as unknown as Date,
      ingredientId: purchase.ingredient.id,
      quantity: Number(purchase.quantity),
    };
  }

  openAddModal() {
    this.showModal = true;
  }

  openEditModal(purchase: IngredientPurchase) {
    this.selectedPurchase = purchase;
    this.editDto = this.toDto(purchase);
    this.showEditModal = true;
  }

  openDeleteModal(purchase: IngredientPurchase) {
    this.selectedPurchase = purchase;
    this.showDeleteModal = true;
  }

  closeAddModal() {
    this.showModal = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPurchase = null;
    this.editDto = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedPurchase = null;
  }

  addPurchase(dto: CreateIngredientPurchaseDto) {
    this.purchaseService.addPurchase(dto).subscribe(() => {
      this.closeAddModal();
      this.fetchPurchases();
    });
  }

  editPurchase(id: string, dto: UpdateIngredientPurchaseDto) {
    this.purchaseService.editPurchase(id, dto).subscribe(() => {
      this.closeEditModal();
      this.fetchPurchases();
    });
  }

  deletePurchase(id: string) {
    this.purchaseService.deletePurchase(id).subscribe(() => {
      this.closeDeleteModal();
      this.fetchPurchases();
    });
  }
}
