import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateIngredientUnitDto,
  DEFAULT_PAGE_SIZE,
  IngredientUnit,
  UpdateIngredientUnitDto,
  createIngredientUnitSchema,
  updateIngredientUnitSchema,
} from '@merlebleu/shared';
import { IngredientUnitService } from './unit.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { capitalizeFirstLetter } from '@shared/utils/text';

@Component({
  selector: 'mb-ingredient-unit',
  templateUrl: './unit.html',
  styleUrls: ['./unit.scss'],
  providers: [IngredientUnitService],
  imports: [ButtonModule, TableModule, Dialog, InputTextModule, FormsModule],
})
export class IngredientUnitComponent {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  allUnits = signal<IngredientUnit[]>([]);
  searchLabel = signal('');
  filteredUnits = computed(() => {
    const search = this.searchLabel().toLowerCase().trim();
    if (!search || search.length < 3) return this.allUnits();
    return this.allUnits().filter((u) => u.label.toLowerCase().includes(search));
  });
  rows = DEFAULT_PAGE_SIZE;
  isLoading = signal(false);
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedUnit: IngredientUnit | null = null;

  addLabel = '';
  editLabel = '';
  addValidationError = '';
  editValidationError = '';

  private unitService = inject(IngredientUnitService);

  ngOnInit() {
    this.fetchUnits();
  }

  fetchUnits() {
    this.isLoading.set(true);
    this.unitService.getAll().subscribe((data) => {
      this.allUnits.set(data);
      this.isLoading.set(false);
    });
  }

  openAddModal() {
    this.addLabel = '';
    this.addValidationError = '';
    this.showAddModal = true;
  }

  openEditModal(unit: IngredientUnit) {
    this.selectedUnit = unit;
    this.editLabel = unit.label;
    this.editValidationError = '';
    this.showEditModal = true;
  }

  openDeleteModal(unit: IngredientUnit) {
    this.selectedUnit = unit;
    this.showDeleteModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUnit = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedUnit = null;
  }

  submitAdd() {
    const dto: CreateIngredientUnitDto = { label: this.addLabel };
    const validation = createIngredientUnitSchema.safeParse(dto);
    if (!validation.success) {
      this.addValidationError = validation.error.issues[0]?.message ?? '';
      return;
    }
    this.unitService.add(validation.data).subscribe(() => {
      this.closeAddModal();
      this.fetchUnits();
    });
  }

  submitEdit() {
    if (!this.selectedUnit) return;
    const dto: UpdateIngredientUnitDto = { label: this.editLabel };
    const validation = updateIngredientUnitSchema.safeParse(dto);
    if (!validation.success) {
      this.editValidationError = validation.error.issues[0]?.message ?? '';
      return;
    }
    this.unitService.update(this.selectedUnit.id, validation.data).subscribe(() => {
      this.closeEditModal();
      this.fetchUnits();
    });
  }

  deleteUnit() {
    if (!this.selectedUnit) return;
    this.unitService.delete(this.selectedUnit.id).subscribe(() => {
      this.closeDeleteModal();
      this.fetchUnits();
    });
  }
}
