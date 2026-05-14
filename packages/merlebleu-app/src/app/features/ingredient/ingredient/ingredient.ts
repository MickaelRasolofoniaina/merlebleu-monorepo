import { Component, OnInit, inject, signal } from '@angular/core';
import {
  CreateIngredientDto,
  DEFAULT_PAGE_SIZE,
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  UpdateIngredientDto,
} from '@merlebleu/shared';
import { IngredientCategoryService } from '../category/category.service';
import { IngredientUnitService } from '../unit/unit.service';
import { IngredientService } from './ingredient.service';
import { IngredientFormComponent } from './components/ingredient-form/ingredient-form.component';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule, TablePageEvent } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { formatUnitPrice } from '@shared/utils/number';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-ingredient-list',
  templateUrl: './ingredient.html',
  styleUrls: ['./ingredient.scss'],
  providers: [IngredientService, IngredientCategoryService, IngredientUnitService],
  imports: [
    ButtonModule,
    TableModule,
    Dialog,
    InputTextModule,
    SelectModule,
    FormsModule,
    IngredientFormComponent,
  ],
})
export class IngredientListComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;
  readonly formatUnitPrice = formatUnitPrice;

  ingredients = signal<Ingredient[]>([]);
  categories = signal<IngredientCategory[]>([]);
  units = signal<IngredientUnit[]>([]);
  isLoading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  first = signal(0);
  rows = DEFAULT_PAGE_SIZE;

  searchLabel = '';
  filterCategoryId: string | null = null;
  filterUnitId: string | null = null;

  showModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedIngredient: Ingredient | null = null;
  editDto: UpdateIngredientDto | null = null;

  private ingredientService = inject(IngredientService);
  private categoryService = inject(IngredientCategoryService);
  private unitService = inject(IngredientUnitService);

  ngOnInit() {
    this.categoryService.getAll().subscribe((data) => this.categories.set(data));
    this.unitService.getAll().subscribe((data) => this.units.set(data));
    this.fetchIngredients();
  }

  private buildFilters() {
    return {
      labelContains: this.searchLabel || undefined,
      categoryId: this.filterCategoryId || undefined,
      unitId: this.filterUnitId || undefined,
    };
  }

  fetchIngredients() {
    this.isLoading.set(true);
    this.ingredientService
      .getIngredients(this.buildFilters(), this.page(), this.rows)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe(({ items, total }) => {
        this.ingredients.set(items);
        this.totalRecords.set(total);
      });
  }

  onSearchChange(value: string) {
    const normalized = value.trim();
    this.searchLabel = normalized;
    this.page.set(1);
    this.first.set(0);
    if (normalized.length > 0 && normalized.length < 3) return;
    this.fetchIngredients();
  }

  onCategoryFilter() {
    this.page.set(1);
    this.first.set(0);
    this.fetchIngredients();
  }

  onUnitFilter() {
    this.page.set(1);
    this.first.set(0);
    this.fetchIngredients();
  }

  onTablePage(event: TablePageEvent) {
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchIngredients();
  }

  toDto(ingredient: Ingredient): UpdateIngredientDto {
    return {
      label: ingredient.label,
      categoryId: ingredient.category.id,
      unitId: ingredient.unit.id,
      unitPrice: ingredient.unitPrice,
    };
  }

  openAddModal() {
    this.showModal = true;
  }

  openEditModal(ingredient: Ingredient) {
    this.selectedIngredient = ingredient;
    this.editDto = this.toDto(ingredient);
    this.showEditModal = true;
  }

  openDeleteModal(ingredient: Ingredient) {
    this.selectedIngredient = ingredient;
    this.showDeleteModal = true;
  }

  closeAddModal() {
    this.showModal = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedIngredient = null;
    this.editDto = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedIngredient = null;
  }

  addIngredient(dto: CreateIngredientDto) {
    this.ingredientService.addIngredient(dto).subscribe(() => {
      this.closeAddModal();
      this.fetchIngredients();
    });
  }

  editIngredient(id: string, dto: UpdateIngredientDto) {
    this.ingredientService.editIngredient(id, dto).subscribe(() => {
      this.closeEditModal();
      this.fetchIngredients();
    });
  }

  deleteIngredient(id: string) {
    this.ingredientService.deleteIngredient(id).subscribe(() => {
      this.closeDeleteModal();
      this.fetchIngredients();
    });
  }
}
