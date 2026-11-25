import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { PaymentMethodBadge } from '@shared/components/payment-method-badge/payment-method-badge';
import { PaymentService } from '@features/sale/payment/payment.service';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { formatUnitPrice } from '@shared/utils/number';
import { ExpenseStoreService } from '../expense-store.service';
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_SECTIONS,
  Expense,
  ExpenseSection,
  getSectionLabel,
  getSectionDotClass,
} from '../expense.model';
import { ExpenseFormComponent, ExpenseFormValue } from './components/expense-form/expense-form.component';

type FilterKey = 'dateFrom' | 'dateTo' | 'section' | 'category' | 'payment';

@Component({
  selector: 'mb-expense-list',
  templateUrl: './expense-list.html',
  imports: [
    DatePipe,
    FormsModule,
    BadgeModule,
    ButtonModule,
    PopoverModule,
    DatePickerModule,
    Dialog,
    InputTextModule,
    SelectModule,
    TableModule,
    StatCard,
    PaymentMethodBadge,
    ExpenseFormComponent,
  ],
})
export class ExpenseListComponent {
  protected readonly store = inject(ExpenseStoreService);
  private readonly messageService = inject(MessageService);
  private readonly paymentService = inject(PaymentService);

  // expense payment methods are matched by name with the ones configured in the payment page
  private readonly paymentColors = signal<Record<string, string>>({});

  protected readonly formatAmount = formatUnitPrice;
  protected readonly getSectionLabel = getSectionLabel;
  protected readonly getSectionDotClass = getSectionDotClass;
  protected readonly sectionOptions =EXPENSE_SECTIONS;
  protected readonly paymentOptions = EXPENSE_PAYMENT_METHODS;

  protected readonly dateFrom = signal<Date | null>(null);
  protected readonly dateTo = signal<Date | null>(null);
  protected readonly sectionFilter = signal<ExpenseSection | null>(null);
  protected readonly categoryFilter = signal<string | null>(null);
  protected readonly paymentFilter = signal<string | null>(null);
  protected readonly search = signal('');

  constructor() {
    this.paymentService.getAllPaymentMethods().subscribe((methods) => {
      this.paymentColors.set(Object.fromEntries(methods.map((m) => [m.name.toLowerCase(), m.color])));
    });
  }

  protected getPaymentColor(name: string): string | undefined {
    return this.paymentColors()[name.toLowerCase()];
  }

  protected readonly draftDateFrom = signal<Date | null>(null);
  protected readonly draftDateTo = signal<Date | null>(null);
  protected readonly draftSection = signal<ExpenseSection | null>(null);
  protected readonly draftCategory = signal<string | null>(null);
  protected readonly draftPayment = signal<string | null>(null);

  protected readonly rows = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const search = this.search().trim().toLowerCase();

    return this.store
      .expenses()
      .map((expense) => ({ expense, category: this.store.getCategory(expense.categoryId) }))
      .filter(({ expense, category }) => {
        if (!category) return false;
        if (from && expense.date < from) return false;
        if (to && expense.date > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
        if (this.sectionFilter() && category.section !== this.sectionFilter()) return false;
        if (this.categoryFilter() && category.id !== this.categoryFilter()) return false;
        if (this.paymentFilter() && expense.paymentMethod !== this.paymentFilter()) return false;
        if (
          search &&
          !category.label.toLowerCase().includes(search) &&
          !expense.note.toLowerCase().includes(search)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.expense.date.getTime() - a.expense.date.getTime());
  });

  protected readonly filteredTotal = computed(() =>
    this.rows().reduce((sum, row) => sum + row.expense.amount, 0),
  );

  protected readonly sectionTotals = computed(() => {
    const totals: Record<ExpenseSection, number> = { CURRENT: 0, INGREDIENT: 0, OTHER: 0 };
    for (const { expense, category } of this.rows()) {
      if (category) totals[category.section] += expense.amount;
    }
    return totals;
  });

  protected showFormDialog = false;
  protected showDeleteDialog = false;
  protected selected: Expense | null = null;
  protected readonly formId = 'expense-form';

  protected openAdd(): void {
    this.selected = null;
    this.showFormDialog = true;
  }

  protected openEdit(expense: Expense): void {
    this.selected = expense;
    this.showFormDialog = true;
  }

  protected openDelete(expense: Expense): void {
    this.selected = expense;
    this.showDeleteDialog = true;
  }

  protected readonly activeChips = computed<{ key: FilterKey; label: string }[]>(() => {
    const chips: { key: FilterKey; label: string }[] = [];
    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();
    const section = this.sectionFilter();
    const categoryId = this.categoryFilter();
    const payment = this.paymentFilter();

    if (dateFrom) chips.push({ key: 'dateFrom', label: `Du : ${dateFrom.toLocaleDateString('fr-FR')}` });
    if (dateTo) chips.push({ key: 'dateTo', label: `Au : ${dateTo.toLocaleDateString('fr-FR')}` });
    if (section) chips.push({ key: 'section', label: `Section : ${getSectionLabel(section)}` });
    if (categoryId) {
      chips.push({ key: 'category', label: `Désignation : ${this.store.getCategory(categoryId)?.label ?? '...'}` });
    }
    if (payment) chips.push({ key: 'payment', label: `Paiement : ${payment}` });
    return chips;
  });

  protected readonly draftCategoryOptions = computed(() => {
    const section = this.draftSection();
    return this.store.categories().filter((c) => !section || c.section === section);
  });

  protected openFilters(popover: Popover, event: Event): void {
    this.draftDateFrom.set(this.dateFrom());
    this.draftDateTo.set(this.dateTo());
    this.draftSection.set(this.sectionFilter());
    this.draftCategory.set(this.categoryFilter());
    this.draftPayment.set(this.paymentFilter());
    popover.toggle(event);
  }

  protected onDraftSectionChange(section: ExpenseSection | null): void {
    this.draftSection.set(section);
    this.draftCategory.set(null);
  }

  protected applyDraft(): void {
    this.dateFrom.set(this.draftDateFrom());
    this.dateTo.set(this.draftDateTo());
    this.sectionFilter.set(this.draftSection());
    this.categoryFilter.set(this.draftCategory());
    this.paymentFilter.set(this.draftPayment());
  }

  protected removeFilter(key: FilterKey): void {
    if (key === 'dateFrom') this.dateFrom.set(null);
    if (key === 'dateTo') this.dateTo.set(null);
    if (key === 'section') {
      this.sectionFilter.set(null);
      this.categoryFilter.set(null);
    }
    if (key === 'category') this.categoryFilter.set(null);
    if (key === 'payment') this.paymentFilter.set(null);
  }

  protected resetFilters(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.sectionFilter.set(null);
    this.categoryFilter.set(null);
    this.paymentFilter.set(null);
  }

  protected save(value: ExpenseFormValue): void {
    if (this.selected) {
      this.store.updateExpense(this.selected.id, value);
      this.messageService.add({ severity: 'success', summary: 'Dépense modifiée' });
      this.showFormDialog = false;
    } else {
      this.store.addExpense(value);
      this.messageService.add({ severity: 'success', summary: 'Dépense ajoutée' });
      this.showFormDialog = false;
    }
  }

  protected saveAndAddAnother(value: ExpenseFormValue): void {
    this.store.addExpense(value);
    this.messageService.add({ severity: 'success', summary: 'Dépense ajoutée' });
  }

  protected confirmDelete(): void {
    if (this.selected) {
      this.store.deleteExpense(this.selected.id);
      this.messageService.add({ severity: 'success', summary: 'Dépense supprimée' });
    }
    this.showDeleteDialog = false;
    this.selected = null;
  }
}
