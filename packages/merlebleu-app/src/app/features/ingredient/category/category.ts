import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateIngredientCategoryDto,
  IngredientCategory,
  UpdateIngredientCategoryDto,
  createIngredientCategorySchema,
  updateIngredientCategorySchema,
} from '@merlebleu/shared';
import { IngredientCategoryService } from './category.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { capitalizeFirstLetter } from '@shared/utils/text';

@Component({
  selector: 'mb-ingredient-category',
  templateUrl: './category.html',
  styleUrls: ['./category.scss'],
  providers: [IngredientCategoryService],
  imports: [ButtonModule, TableModule, Dialog, InputTextModule, FormsModule],
})
export class IngredientCategoryComponent {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  categories = signal<IngredientCategory[]>([]);
  isLoading = signal(false);
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCategory: IngredientCategory | null = null;

  addLabel = '';
  editLabel = '';
  addValidationError = '';
  editValidationError = '';

  private categoryService = inject(IngredientCategoryService);

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe((data) => {
      this.categories.set(data);
      this.isLoading.set(false);
    });
  }

  openAddModal() {
    this.addLabel = '';
    this.addValidationError = '';
    this.showAddModal = true;
  }

  openEditModal(category: IngredientCategory) {
    this.selectedCategory = category;
    this.editLabel = category.label;
    this.editValidationError = '';
    this.showEditModal = true;
  }

  openDeleteModal(category: IngredientCategory) {
    this.selectedCategory = category;
    this.showDeleteModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedCategory = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCategory = null;
  }

  submitAdd() {
    const dto: CreateIngredientCategoryDto = { label: this.addLabel };
    const validation = createIngredientCategorySchema.safeParse(dto);
    if (!validation.success) {
      this.addValidationError = validation.error.issues[0]?.message ?? '';
      return;
    }
    this.categoryService.add(validation.data).subscribe(() => {
      this.closeAddModal();
      this.fetchCategories();
    });
  }

  submitEdit() {
    if (!this.selectedCategory) return;
    const dto: UpdateIngredientCategoryDto = { label: this.editLabel };
    const validation = updateIngredientCategorySchema.safeParse(dto);
    if (!validation.success) {
      this.editValidationError = validation.error.issues[0]?.message ?? '';
      return;
    }
    this.categoryService.update(this.selectedCategory.id, validation.data).subscribe(() => {
      this.closeEditModal();
      this.fetchCategories();
    });
  }

  deleteCategory() {
    if (!this.selectedCategory) return;
    this.categoryService.delete(this.selectedCategory.id).subscribe(() => {
      this.closeDeleteModal();
      this.fetchCategories();
    });
  }
}
