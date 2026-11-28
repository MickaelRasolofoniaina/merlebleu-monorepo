import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IngredientUnit,
  createIngredientUnitSchema,
  updateIngredientUnitSchema,
} from '@merlebleu/shared';
import { IngredientUnitService } from './unit.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { finalize } from 'rxjs';

@Component({
  selector: 'mb-ingredient-unit',
  templateUrl: './unit.html',
  styleUrls: ['./unit.scss'],
  providers: [IngredientUnitService],
  imports: [ButtonModule, TableModule, Dialog, InputTextModule, FormsModule],
})
export class IngredientUnitComponent implements OnInit {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  allUnits = signal<IngredientUnit[]>([]);
  searchLabel = signal('');
  filteredUnits = computed(() => {
    const search = this.searchLabel().toLowerCase().trim();
    if (!search || search.length < 3) return this.allUnits();
    return this.allUnits().filter((u) => u.label.toLowerCase().includes(search));
  });
  rows = 10;
  isLoading = signal(false);

  label = signal('');
  validationError = signal('');

  showDeleteModal = false;
  selectedUnit: IngredientUnit | null = null;
  unitToDelete: IngredientUnit | null = null;

  private unitService = inject(IngredientUnitService);

  ngOnInit() {
    this.fetchUnits();
  }

  fetchUnits() {
    this.isLoading.set(true);
    this.unitService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((data) => this.allUnits.set(data));
  }

  openEditPanel(unit: IngredientUnit) {
    this.selectedUnit = unit;
    this.label.set(unit.label);
    this.validationError.set('');
  }

  /** Leaves edit mode and goes back to the "create" form. */
  closeEditPanel() {
    this.selectedUnit = null;
    this.label.set('');
    this.validationError.set('');
  }

  openDeleteModal(unit: IngredientUnit) {
    this.unitToDelete = unit;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.unitToDelete = null;
  }

  submit() {
    const schema = this.selectedUnit ? updateIngredientUnitSchema : createIngredientUnitSchema;
    const validation = schema.safeParse({ label: this.label() });
    if (!validation.success) {
      this.validationError.set(validation.error.issues[0]?.message ?? '');
      return;
    }
    this.validationError.set('');

    const request = this.selectedUnit
      ? this.unitService.update(this.selectedUnit.id, validation.data)
      : this.unitService.add(validation.data);
    request.subscribe(() => {
      this.closeEditPanel();
      this.fetchUnits();
    });
  }

  deleteUnit(id: string) {
    this.unitService.delete(id).subscribe(() => {
      if (this.selectedUnit?.id === id) {
        this.closeEditPanel();
      }
      this.closeDeleteModal();
      this.fetchUnits();
    });
  }
}
