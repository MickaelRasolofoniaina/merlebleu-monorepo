import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { CreateFixedExpenseDto, Expense, FixedExpenseType } from '@merlebleu/shared';
import { formatUnitPrice } from '@shared/utils/number';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { MonthSwitcherComponent } from '../components/month-switcher/month-switcher';
import { ExpenseStoreService } from '../expense-store.service';
import { FixedExpenseFormComponent } from './components/fixed-expense-form/fixed-expense-form.component';

type PaymentStatusFilter = 'ALL' | 'PAID' | 'UNPAID';

@Component({
  selector: 'mb-fixed-expense',
  templateUrl: './fixed-expense.html',
  imports: [FormsModule, SelectButtonModule, ButtonModule, MenuModule, Dialog, TableModule, TagModule, StatCard, MonthSwitcherComponent, FixedExpenseFormComponent],
})
export class FixedExpenseComponent {
  protected readonly store = inject(ExpenseStoreService);
  private readonly messageService = inject(MessageService);

  protected readonly formatAmount = formatUnitPrice;

  protected readonly FixedExpenseType = FixedExpenseType;

  protected readonly salaries = computed(() => this.byType(FixedExpenseType.SALARY));
  protected readonly charges = computed(() => this.byType(FixedExpenseType.CHARGE));
  protected readonly statusOptions: { label: string; value: PaymentStatusFilter }[] = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Payé', value: 'PAID' },
    { label: 'À payer', value: 'UNPAID' },
  ];
  protected readonly statusFilter = signal<PaymentStatusFilter>('ALL');

  private matchesStatus(expense: Expense): boolean {
    const filter = this.statusFilter();
    return filter === 'ALL' || (filter === 'PAID') === !!expense.paid;
  }

  /** Salaries and charges matching the status filter, shown in the table. */
  protected readonly visibleSalaries = computed(() => this.salaries().filter((e) => this.matchesStatus(e)));
  protected readonly visibleCharges = computed(() => this.charges().filter((e) => this.matchesStatus(e)));

  protected readonly salaryTotal = computed(() => this.sum(this.salaries()));
  protected readonly chargeTotal = computed(() => this.sum(this.charges()));
  protected readonly total = computed(() => this.salaryTotal() + this.chargeTotal());
  protected readonly paidTotal = computed(() =>
    this.sum(this.store.fixedExpenses().filter((e) => e.paid)),
  );
  protected readonly remainingTotal = computed(() => this.total() - this.paidTotal());
  // salaries first, then charges: the table groups consecutive rows by type
  protected readonly allRows = computed(() => [...this.salaries(), ...this.charges()]);
  protected readonly rows = computed(() => [...this.visibleSalaries(), ...this.visibleCharges()]);
  protected readonly visibleSalaryTotal = computed(() => this.sum(this.visibleSalaries()));
  protected readonly visibleChargeTotal = computed(() => this.sum(this.visibleCharges()));
  protected readonly paidCount = computed(() => this.allRows().filter((e) => e.paid).length);
  protected readonly paidPercent = computed(() =>
    this.total() > 0 ? Math.round((this.paidTotal() / this.total()) * 100) : 0,
  );

  protected readonly menuItems: MenuItem[] = [
    { label: 'Copier depuis le mois précédent', icon: 'pi pi-copy', command: () => this.copyFromPreviousMonth() },
  ];

  protected readonly isCopying = signal(false);

  private readonly form = viewChild(FixedExpenseFormComponent);

  protected showFormDialog = false;
  protected showDeleteDialog = false;
  protected selected: Expense | null = null;
  protected formType: FixedExpenseType = FixedExpenseType.SALARY;
  protected readonly formId = 'fixed-expense-form';

  /** Fixed expenses of one type, highest amount first. */
  private byType(type: FixedExpenseType): Expense[] {
    return this.store
      .fixedExpenses()
      .filter((e) => e.fixedType === type)
      .sort((a, b) => b.amount - a.amount);
  }

  private sum(list: Expense[]): number {
    return list.reduce((sum, e) => sum + e.amount, 0);
  }

  protected openAdd(type: FixedExpenseType): void {
    this.selected = null;
    this.formType = type;
    this.showFormDialog = true;
  }

  protected openEdit(expense: Expense): void {
    this.selected = expense;
    this.formType = expense.fixedType ?? FixedExpenseType.SALARY;
    this.showFormDialog = true;
  }

  protected openDelete(expense: Expense): void {
    this.selected = expense;
    this.showDeleteDialog = true;
  }

  protected save(value: CreateFixedExpenseDto): void {
    const isEdit = this.selected !== null;
    const request = this.selected
      ? this.store.updateFixedExpense(this.selected.id, value)
      : this.store.addFixedExpense(value);
    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: isEdit ? 'Ligne modifiée' : 'Ligne ajoutée' });
        if (!isEdit) this.form()?.reset();
        this.showFormDialog = false;
      },
    });
  }

  protected togglePaid(expense: Expense): void {
    this.store.setFixedExpensePaid(expense, !expense.paid).subscribe();
  }

  protected confirmDelete(): void {
    if (!this.selected) return;
    this.store.deleteExpense(this.selected.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Ligne supprimée' });
        this.showDeleteDialog = false;
        this.selected = null;
      },
    });
  }

  protected copyFromPreviousMonth(): void {
    if (this.isCopying()) return;
    this.isCopying.set(true);
    this.store
      .copyFixedFromPreviousMonth()
      .pipe(finalize(() => this.isCopying.set(false)))
      .subscribe({
        next: (copies) =>
          this.messageService.add(
            copies.length > 0
              ? { severity: 'success', summary: 'Copie effectuée', detail: `${copies.length} lignes copiées, à payer.` }
              : { severity: 'warn', summary: 'Rien à copier', detail: 'Aucune nouvelle dépense fixe à copier du mois précédent.' },
          ),
      });
  }
}
