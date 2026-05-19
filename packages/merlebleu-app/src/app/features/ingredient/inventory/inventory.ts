import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Ingredient, IngredientCategory, IngredientUnit } from '@merlebleu/shared';
import { IngredientCategoryService } from '../category/category.service';
import { IngredientUnitService } from '../unit/unit.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { ReportGeneratorService } from '@shared/services/report-generator.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-inventory',
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.scss'],
  providers: [IngredientService, IngredientCategoryService, IngredientUnitService],
  imports: [
    FormsModule,
    TableModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    ButtonModule,
    TagModule,
  ],
})
export class InventoryComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;
  readonly Number = Number;

  ingredients = signal<Ingredient[]>([]);
  categories = signal<IngredientCategory[]>([]);
  units = signal<IngredientUnit[]>([]);
  isLoading = signal(false);
  savingIds = signal<Set<string>>(new Set());

  searchLabel = '';
  filterCategoryId: string | null = null;
  filterUnitId: string | null = null;
  filterStatus = signal<'out_of_stock' | 'available' | null>(null);

  readonly statusOptions = [
    { label: 'En Rupture', value: 'out_of_stock' },
    { label: 'Disponible', value: 'available' },
  ];

  filteredIngredients = computed(() => {
    const status = this.filterStatus();
    if (!status) return this.ingredients();
    return this.ingredients().filter((i) =>
      status === 'out_of_stock' ? Number(i.stock) === 0 : Number(i.stock) > 0
    );
  });

  stockValues: Record<string, number> = {};

  private ingredientService = inject(IngredientService);
  private categoryService = inject(IngredientCategoryService);
  private unitService = inject(IngredientUnitService);
  private messageService = inject(MessageService);
  private reportGeneratorService = inject(ReportGeneratorService);

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
      .getIngredients(this.buildFilters(), 1, 1000)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ items }) => {
        this.ingredients.set(items);
        for (const ingredient of items) {
          if (!(ingredient.id in this.stockValues)) {
            this.stockValues[ingredient.id] = Number(ingredient.stock);
          }
        }
      });
  }

  onSearchChange(value: string) {
    const normalized = value.trim();
    this.searchLabel = normalized;
    if (normalized.length > 0 && normalized.length < 3) return;
    this.fetchIngredients();
  }

  onCategoryFilter() {
    this.fetchIngredients();
  }

  onUnitFilter() {
    this.fetchIngredients();
  }

  onBlur(ingredient: Ingredient) {
    if (this.isSaving(ingredient.id)) return;
    if (this.stockValues[ingredient.id] === Number(ingredient.stock)) return;
    this.onSave(ingredient);
  }

  onSave(ingredient: Ingredient) {
    const stock = this.stockValues[ingredient.id] ?? 0;
    const ids = new Set(this.savingIds());
    ids.add(ingredient.id);
    this.savingIds.set(ids);

    this.ingredientService.updateIngredientStock(ingredient.id, stock).subscribe({
      next: (updated) => {
        this.ingredients.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
        this.stockValues[ingredient.id] = Number(updated.stock);
        const saving = new Set(this.savingIds());
        saving.delete(ingredient.id);
        this.savingIds.set(saving);
        this.messageService.add({
          severity: 'success',
          summary: 'Enregistré',
          detail: 'Stock mis à jour.',
          life: 3000,
        });
      },
      error: () => {
        const saving = new Set(this.savingIds());
        saving.delete(ingredient.id);
        this.savingIds.set(saving);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de mettre à jour le stock.',
          life: 5000,
        });
      },
    });
  }

  isSaving(id: string): boolean {
    return this.savingIds().has(id);
  }

  generateShoppingList() {
    const outOfStock = this.ingredients().filter((i) => Number(i.stock) === 0);
    this.reportGeneratorService.generateShoppingList(outOfStock);
  }
}
