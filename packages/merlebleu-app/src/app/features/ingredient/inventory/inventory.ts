import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MessageService } from 'primeng/api';
import { capitalizeFirstLetter } from '@shared/utils/text';
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
  ],
})
export class InventoryComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  ingredients = signal<Ingredient[]>([]);
  categories = signal<IngredientCategory[]>([]);
  units = signal<IngredientUnit[]>([]);
  isLoading = signal(false);
  savingIds = signal<Set<string>>(new Set());

  searchLabel = '';
  filterCategoryId: string | null = null;
  filterUnitId: string | null = null;

  stockValues: Record<string, number> = {};

  private ingredientService = inject(IngredientService);
  private categoryService = inject(IngredientCategoryService);
  private unitService = inject(IngredientUnitService);
  private messageService = inject(MessageService);

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

  async generateShoppingList() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const outOfStock = this.ingredients().filter((i) => Number(i.stock) === 0);
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(16);
    doc.text('Liste des ingrédients à acheter', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date : ${today}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Désignation', 'Catégorie', 'Stock restant']],
      body: outOfStock.map((i) => [
        capitalizeFirstLetter(i.label),
        capitalizeFirstLetter(i.category.label),
        '0',
      ]),
      styles: { font: 'helvetica' },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 2: { halign: 'right' } },
    });

    doc.save(`liste-ingredient-a-acheter-${today.replace(/\//g, '-')}.pdf`);
  }
}
