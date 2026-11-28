import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CreateRecipeDto, Ingredient, Recipe } from '@merlebleu/shared';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';
import { IngredientService } from '../ingredient/ingredient.service';
import { RecipeService } from './recipe.service';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component';

type StatusFilter = 'active' | 'archived' | 'all';

@Component({
  selector: 'mb-recipe-list',
  templateUrl: './recipe.html',
  providers: [RecipeService, IngredientService, ConfirmationService],
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    ConfirmDialog,
    Dialog,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    RecipeFormComponent,
  ],
})
export class RecipeListComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  readonly statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Recettes actives', value: 'active' },
    { label: 'Archivées', value: 'archived' },
    { label: 'Toutes', value: 'all' },
  ];

  recipes = signal<Recipe[]>([]);
  ingredients = signal<Ingredient[]>([]);
  isLoading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  first = signal(0);
  rows = 10;

  filterLabelContains = '';
  filterStatus: StatusFilter = 'active';

  showModal = false;
  selectedRecipe: Recipe | null = null;

  private confirmationService = inject(ConfirmationService);
  private recipeService = inject(RecipeService);
  private ingredientService = inject(IngredientService);

  ngOnInit() {
    this.ingredientService
      .getIngredients({}, 1, 1000)
      .subscribe(({ items }) => this.ingredients.set(items));
    this.fetchRecipes();
  }

  fetchRecipes() {
    this.isLoading.set(true);
    this.recipeService
      .getRecipes(
        {
          labelContains: this.filterLabelContains || undefined,
          isActive: this.filterStatus === 'all' ? undefined : this.filterStatus === 'active',
        },
        this.page(),
        this.rows,
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ items, total }) => {
        this.recipes.set(items);
        this.totalRecords.set(total);
      });
  }

  onSearchChange(value: string) {
    const normalized = value.trim();
    this.filterLabelContains = normalized;
    this.resetPage();
    if (normalized.length > 0 && normalized.length < 3) return;
    this.fetchRecipes();
  }

  onStatusFilter() {
    this.resetPage();
    this.fetchRecipes();
  }

  onTablePage(event: TablePageEvent) {
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchRecipes();
  }

  openAddModal() {
    this.selectedRecipe = null;
    this.showModal = true;
  }

  openEditModal(recipe: Recipe) {
    this.selectedRecipe = recipe;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRecipe = null;
  }

  saveRecipe(dto: CreateRecipeDto) {
    const request = this.selectedRecipe
      ? this.recipeService.editRecipe(this.selectedRecipe.id, dto)
      : this.recipeService.addRecipe(dto);
    request.subscribe(() => {
      this.closeModal();
      this.fetchRecipes();
    });
  }

  duplicateRecipe(recipe: Recipe) {
    this.recipeService.duplicateRecipe(recipe.id).subscribe(() => this.fetchRecipes());
  }

  confirmArchive(recipe: Recipe) {
    this.confirmationService.confirm({
      header: 'Archiver la recette',
      message: `Archiver la recette « ${recipe.name} » ? Elle ne sera plus proposée dans la production du jour, mais les productions déjà enregistrées sont conservées. Vous pourrez la réactiver à tout moment.`,
      acceptLabel: 'Archiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.recipeService.archiveRecipe(recipe.id).subscribe(() => this.fetchRecipes());
      },
    });
  }

  restoreRecipe(recipe: Recipe) {
    this.recipeService.restoreRecipe(recipe.id).subscribe(() => this.fetchRecipes());
  }

  private resetPage() {
    this.page.set(1);
    this.first.set(0);
  }
}
