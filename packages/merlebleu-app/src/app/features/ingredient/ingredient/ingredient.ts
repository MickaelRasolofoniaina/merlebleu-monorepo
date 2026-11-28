import { Component, OnInit, inject, signal } from '@angular/core';
import {
  CreateIngredientDto,
  DEFAULT_PAGE_SIZE,
  Ingredient,
  IngredientUnit,
  UpdateIngredientDto,
} from '@merlebleu/shared';
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
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-ingredient-list',
  templateUrl: './ingredient.html',
  styleUrls: ['./ingredient.scss'],
  providers: [IngredientService, IngredientUnitService],
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

  ingredients = signal<Ingredient[]>([]);
  units = signal<IngredientUnit[]>([]);
  isLoading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  first = signal(0);
  rows = DEFAULT_PAGE_SIZE;

  searchLabel = '';
  filterUnitId: string | null = null;

  showDeleteModal = false;
  selectedIngredient: Ingredient | null = null;
  ingredientToDelete: Ingredient | null = null;
  editDto: UpdateIngredientDto | null = null;

  private ingredientService = inject(IngredientService);
  private unitService = inject(IngredientUnitService);

  ngOnInit() {
    this.unitService.getAll().subscribe((data) => this.units.set(data));
    this.fetchIngredients();
  }

  private buildFilters() {
    return {
      labelContains: this.searchLabel || undefined,
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
      unitId: ingredient.unit.id,
      defaultPaymentMethodId: ingredient.defaultPaymentMethod?.id ?? null,
    };
  }

  openEditPanel(ingredient: Ingredient) {
    this.selectedIngredient = ingredient;
    this.editDto = this.toDto(ingredient);
  }

  /** Leaves edit mode and goes back to the "create" form. */
  closeEditPanel() {
    this.selectedIngredient = null;
    this.editDto = null;
  }

  openDeleteModal(ingredient: Ingredient) {
    this.ingredientToDelete = ingredient;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.ingredientToDelete = null;
  }

  onFormSubmit(dto: CreateIngredientDto | UpdateIngredientDto) {
    if (this.selectedIngredient) {
      this.editIngredient(this.selectedIngredient.id, dto);
    } else {
      this.addIngredient(dto as CreateIngredientDto);
    }
  }

  addIngredient(dto: CreateIngredientDto) {
    this.ingredientService.addIngredient(dto).subscribe(() => {
      this.fetchIngredients();
    });
  }

  editIngredient(id: string, dto: UpdateIngredientDto) {
    this.ingredientService.editIngredient(id, dto).subscribe(() => {
      this.closeEditPanel();
      this.fetchIngredients();
    });
  }

  deleteIngredient(id: string) {
    this.ingredientService.deleteIngredient(id).subscribe(() => {
      if (this.selectedIngredient?.id === id) {
        this.closeEditPanel();
      }
      this.closeDeleteModal();
      this.fetchIngredients();
    });
  }
}
