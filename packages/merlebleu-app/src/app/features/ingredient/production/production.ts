import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { Ingredient, Production, Recipe } from '@merlebleu/shared';
import { addDays, formatDate } from '@shared/utils/date';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';
import { IngredientService } from '../ingredient/ingredient.service';
import { RecipeService } from '../recipe/recipe.service';
import { ProductionService } from './production.service';
import {
  ProductionLine,
  buildUsageRows,
  computeConsumption,
} from './production.calculations';

@Component({
  selector: 'mb-production',
  templateUrl: './production.html',
  providers: [ProductionService, RecipeService, IngredientService],
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    MessageModule,
    SelectModule,
    TableModule,
  ],
})
export class ProductionComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  date: Date = new Date();
  lines = signal<ProductionLine[]>([]);
  ingredients = signal<Ingredient[]>([]);
  activeRecipes = signal<Recipe[]>([]);
  /** Recipes already produced that day, including archived ones. */
  savedRecipes = signal<Recipe[]>([]);
  savedConsumption = signal<Map<string, number>>(new Map());
  selectedRecipeId: string | null = null;
  isLoading = signal(false);
  isSaving = signal(false);

  recipeMap = computed(() => {
    const map = new Map<string, Recipe>();
    for (const recipe of [...this.savedRecipes(), ...this.activeRecipes()]) map.set(recipe.id, recipe);
    return map;
  });

  availableRecipes = computed(() => {
    const used = new Set(this.lines().map((line) => line.recipeId));
    return this.activeRecipes().filter((recipe) => !used.has(recipe.id));
  });

  consumption = computed(() => computeConsumption(this.lines(), this.recipeMap()));

  usageRows = computed(() =>
    buildUsageRows(this.consumption(), this.savedConsumption(), this.ingredients()),
  );

  shortageLabels = computed(() =>
    this.usageRows()
      .filter((row) => row.remaining < 0)
      .map((row) => capitalizeFirstLetter(row.ingredient.label)),
  );

  private productionService = inject(ProductionService);
  private recipeService = inject(RecipeService);
  private ingredientService = inject(IngredientService);
  private messageService = inject(MessageService);

  ngOnInit() {
    this.recipeService
      .getRecipes({ isActive: true }, 1, 1000)
      .subscribe(({ items }) => this.activeRecipes.set(items));
    this.refreshIngredients();
    this.loadDay();
  }

  onDateChange(date: Date | null) {
    if (!date) return;
    this.date = date;
    this.loadDay();
  }

  shiftDay(days: number) {
    this.onDateChange(addDays(this.date, days));
  }

  recipeName(recipeId: string): string {
    return capitalizeFirstLetter(this.recipeMap().get(recipeId)?.name ?? '');
  }

  lineConsumption(line: ProductionLine) {
    return (this.recipeMap().get(line.recipeId)?.lines ?? []).map((recipeLine) => ({
      id: recipeLine.id,
      label: capitalizeFirstLetter(recipeLine.ingredient.label),
      unit: recipeLine.ingredient.unit.label,
      quantity: Number(recipeLine.quantity) * line.quantity,
    }));
  }

  updateQuantity(index: number, quantity: number | null) {
    this.lines.update((lines) =>
      lines.map((line, i) => (i === index ? { ...line, quantity: quantity ?? 0 } : line)),
    );
  }

  addLine() {
    if (!this.selectedRecipeId) return;
    const recipeId = this.selectedRecipeId;
    this.lines.update((lines) => [...lines, { recipeId, quantity: 1 }]);
    this.selectedRecipeId = null;
  }

  removeLine(index: number) {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  hasInvalidLine(): boolean {
    return this.lines().some((line) => !(line.quantity > 0));
  }

  save() {
    if (this.hasInvalidLine()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Quantité manquante',
        detail: 'Chaque recette doit avoir un nombre de fournées supérieur à 0.',
      });
      return;
    }
    this.isSaving.set(true);
    this.productionService
      .saveDay({ productionDate: formatDate(this.date), lines: this.lines() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: ({ productions, shortages }) => {
          this.applyProductions(productions);
          this.refreshIngredients();
          this.messageService.add({
            severity: shortages.length ? 'warn' : 'success',
            summary: 'Journée enregistrée',
            detail: shortages.length
              ? `Stock négatif : ${shortages.map((s) => s.ingredient.label).join(', ')}.`
              : undefined,
          });
        },
      });
  }

  private loadDay() {
    this.isLoading.set(true);
    this.productionService
      .getProductions(formatDate(this.date))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((productions) => this.applyProductions(productions));
  }

  private refreshIngredients() {
    this.ingredientService
      .getIngredients({}, 1, 1000)
      .subscribe(({ items }) => this.ingredients.set(items));
  }

  private applyProductions(productions: Production[]) {
    this.lines.set(
      productions.map((p) => ({ recipeId: p.recipe.id, quantity: Number(p.quantity) })),
    );
    this.savedRecipes.set(productions.map((p) => p.recipe));
    const saved = new Map<string, number>();
    for (const production of productions) {
      for (const consumption of production.consumptions) {
        const id = consumption.ingredient.id;
        saved.set(id, (saved.get(id) ?? 0) + Number(consumption.quantity));
      }
    }
    this.savedConsumption.set(saved);
  }
}
