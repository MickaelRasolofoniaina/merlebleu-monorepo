import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { formatUnitPrice } from '@shared/utils/number';
import { ExpenseStoreService } from '../expense-store.service';
import {
  CATEGORY_SECTIONS,
  ExpenseCategory,
  ExpenseSection,
  getSectionLabel,
  getSectionSeverity,
} from '../expense.model';
import {
  CategoryFormComponent,
  CategoryFormValue,
} from './components/category-form/category-form.component';

@Component({
  selector: 'mb-expense-category',
  templateUrl: './expense-category.html',
  imports: [
    FormsModule,
    ButtonModule,
    Dialog,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    CategoryFormComponent,
  ],
})
export class ExpenseCategoryComponent {
  protected readonly store = inject(ExpenseStoreService);
  private readonly messageService = inject(MessageService);

  protected readonly formatAmount = formatUnitPrice;
  protected readonly getSectionLabel = getSectionLabel;
  protected readonly getSectionSeverity = getSectionSeverity;
  protected readonly sectionOptions = CATEGORY_SECTIONS;

  protected readonly sectionFilter = signal<ExpenseSection | null>(null);
  protected readonly search = signal('');

  protected readonly usageByCategory = computed(() => {
    const usage = new Map<string, number>();
    for (const expense of this.store.monthExpenses()) {
      usage.set(expense.categoryId, (usage.get(expense.categoryId) ?? 0) + 1);
    }
    return usage;
  });

  protected readonly rows = computed(() => {
    const search = this.search().trim().toLowerCase();
    return this.store
      .categories()
      .filter((c) => c.section !== 'INGREDIENT')
      .filter((c) => !this.sectionFilter() || c.section === this.sectionFilter())
      .filter((c) => !search || c.label.toLowerCase().includes(search));
  });

  protected showFormDialog = false;
  protected showDeleteDialog = false;
  protected selected: ExpenseCategory | null = null;
  protected readonly formId = 'expense-category-form';

  protected usageCount(category: ExpenseCategory): number {
    return this.usageByCategory().get(category.id) ?? 0;
  }

  protected openAdd(): void {
    this.selected = null;
    this.showFormDialog = true;
  }

  protected openEdit(category: ExpenseCategory): void {
    this.selected = category;
    this.showFormDialog = true;
  }

  protected openDelete(category: ExpenseCategory): void {
    this.selected = category;
    this.showDeleteDialog = true;
  }

  protected save(value: CategoryFormValue): void {
    if (this.selected) {
      this.store.updateCategory(this.selected.id, value);
      this.messageService.add({ severity: 'success', summary: 'Désignation modifiée' });
    } else {
      this.store.addCategory(value);
      this.messageService.add({ severity: 'success', summary: 'Désignation ajoutée' });
    }
    this.showFormDialog = false;
  }

  protected confirmDelete(): void {
    if (this.selected) {
      this.store.deleteCategory(this.selected.id);
      this.messageService.add({ severity: 'success', summary: 'Désignation supprimée' });
    }
    this.showDeleteDialog = false;
    this.selected = null;
  }
}
