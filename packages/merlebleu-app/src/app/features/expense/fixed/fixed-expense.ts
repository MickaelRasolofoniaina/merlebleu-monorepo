import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { formatUnitPrice } from '@shared/utils/number';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { MonthSwitcherComponent } from '../components/month-switcher/month-switcher';
import { ExpenseStoreService } from '../expense-store.service';
import { FixedExpense, FixedExpenseType } from '../expense.model';
import {
  FixedExpenseFormComponent,
  FixedExpenseFormValue,
} from './components/fixed-expense-form/fixed-expense-form.component';

@Component({
  selector: 'mb-fixed-expense',
  templateUrl: './fixed-expense.html',
  imports: [ButtonModule, MenuModule, Dialog, TableModule, TagModule, StatCard, MonthSwitcherComponent, FixedExpenseFormComponent],
})
export class FixedExpenseComponent {
  protected readonly store = inject(ExpenseStoreService);
  private readonly messageService = inject(MessageService);

  protected readonly formatAmount = formatUnitPrice;

  protected readonly salaries = computed(() =>
    this.store.monthFixedExpenses().filter((e) => e.type === 'SALARY'),
  );
  protected readonly charges = computed(() =>
    this.store.monthFixedExpenses().filter((e) => e.type === 'CHARGE'),
  );
  protected readonly salaryTotal = computed(() => this.sum(this.salaries()));
  protected readonly chargeTotal = computed(() => this.sum(this.charges()));
  protected readonly total = computed(() => this.salaryTotal() + this.chargeTotal());
  protected readonly paidTotal = computed(() =>
    this.sum(this.store.monthFixedExpenses().filter((e) => e.paid)),
  );
  protected readonly remainingTotal = computed(() => this.total() - this.paidTotal());
  // salaries first, then charges: the table groups consecutive rows by type
  protected readonly rows = computed(() => [...this.salaries(), ...this.charges()]);
  protected readonly paidCount = computed(() => this.rows().filter((e) => e.paid).length);
  protected readonly paidPercent = computed(() =>
    this.total() > 0 ? Math.round((this.paidTotal() / this.total()) * 100) : 0,
  );

  protected readonly menuItems: MenuItem[] = [
    { label: 'Copier depuis le mois précédent', icon: 'pi pi-copy', command: () => this.copyFromPreviousMonth() },
  ];

  protected showFormDialog = false;
  protected showDeleteDialog = false;
  protected selected: FixedExpense | null = null;
  protected formType: FixedExpenseType = 'SALARY';
  protected readonly formId = 'fixed-expense-form';

  private sum(list: FixedExpense[]): number {
    return list.reduce((sum, e) => sum + e.amount, 0);
  }

  protected openAdd(type: FixedExpenseType): void {
    this.selected = null;
    this.formType = type;
    this.showFormDialog = true;
  }

  protected openEdit(expense: FixedExpense): void {
    this.selected = expense;
    this.formType = expense.type;
    this.showFormDialog = true;
  }

  protected openDelete(expense: FixedExpense): void {
    this.selected = expense;
    this.showDeleteDialog = true;
  }

  protected save(value: FixedExpenseFormValue): void {
    if (this.selected) {
      this.store.updateFixedExpense(this.selected.id, value);
      this.messageService.add({ severity: 'success', summary: 'Ligne modifiée' });
    } else {
      this.store.addFixedExpense(value);
      this.messageService.add({ severity: 'success', summary: 'Ligne ajoutée' });
    }
    this.showFormDialog = false;
  }

  protected confirmDelete(): void {
    if (this.selected) {
      this.store.deleteFixedExpense(this.selected.id);
      this.messageService.add({ severity: 'success', summary: 'Ligne supprimée' });
    }
    this.showDeleteDialog = false;
    this.selected = null;
  }

  protected copyFromPreviousMonth(): void {
    const count = this.store.copyFixedFromPreviousMonth();
    this.messageService.add(
      count > 0
        ? { severity: 'success', summary: 'Copie effectuée', detail: `${count} lignes copiées, à payer.` }
        : { severity: 'warn', summary: 'Rien à copier', detail: 'Aucune dépense fixe le mois précédent.' },
    );
  }
}
