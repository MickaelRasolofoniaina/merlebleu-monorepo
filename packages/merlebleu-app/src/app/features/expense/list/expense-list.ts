import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Expense, ExpenseNature, ExpenseSection, FixedExpenseType } from '@merlebleu/shared';
import { formatUnitPrice } from '@shared/utils/number';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { MonthSwitcherComponent } from '../components/month-switcher/month-switcher';
import { ExpenseStoreService } from '../expense-store.service';
import { getSectionLabel, getSectionSeverity } from '../expense.model';

type SectionFilter = 'ALL' | 'FIXED' | ExpenseSection;
type TagSeverity = 'success' | 'info' | 'warn' | 'secondary';

interface ExpenseRow {
  id: string;
  /** YYYY-MM-DD. */
  date: string;
  label: string;
  detail: string | null;
  section: SectionFilter;
  sectionLabel: string;
  sectionSeverity: TagSeverity;
  /** `null` for a variable expense, which has no payment status. */
  paid: boolean | null;
  amount: number;
}

interface DayTotal {
  title: string;
  count: number;
  total: number;
}

@Component({
  selector: 'mb-expense-list',
  templateUrl: './expense-list.html',
  imports: [FormsModule, InputTextModule, SelectButtonModule, TableModule, TagModule, StatCard, MonthSwitcherComponent],
})
export class ExpenseListComponent {
  protected readonly store = inject(ExpenseStoreService);

  protected readonly formatAmount = formatUnitPrice;

  protected readonly sectionOptions: { label: string; value: SectionFilter }[] = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Courantes', value: ExpenseSection.CURRENT },
    { label: 'Ingrédients', value: ExpenseSection.INGREDIENT },
    { label: 'Autres', value: ExpenseSection.OTHER },
    { label: 'Fixes', value: 'FIXED' },
  ];

  protected readonly sectionFilter = signal<SectionFilter>('ALL');
  protected readonly search = signal('');

  /** Fixed expenses still to pay are left out: only what has actually been spent is listed. */
  private readonly allRows = computed<ExpenseRow[]>(() =>
    this.store
      .expenses()
      .filter((e) => e.nature !== ExpenseNature.FIXED || e.paid)
      .map((e) => this.toRow(e)),
  );

  /** Rows matching the filters, newest day first, biggest amount first within a day: the table groups consecutive rows by date. */
  protected readonly rows = computed(() => {
    const section = this.sectionFilter();
    const search = this.search().trim().toLowerCase();

    return this.allRows()
      .filter((row) => section === 'ALL' || row.section === section)
      .filter((row) => !search || `${row.label} ${row.detail ?? ''}`.toLowerCase().includes(search))
      .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount || a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  });

  protected readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.amount, 0));
  protected readonly average = computed(() => (this.rows().length ? Math.round(this.total() / this.rows().length) : 0));
  protected readonly highest = computed(() => this.rows().reduce((max, row) => Math.max(max, row.amount), 0));

  private readonly dayTotals = computed(() => {
    const totals = new Map<string, DayTotal>();
    for (const row of this.rows()) {
      const day = totals.get(row.date) ?? { title: this.formatDay(row.date), count: 0, total: 0 };
      day.count += 1;
      day.total += row.amount;
      totals.set(row.date, day);
    }
    return totals;
  });

  protected dayOf(date: string): DayTotal {
    return this.dayTotals().get(date) ?? { title: date, count: 0, total: 0 };
  }

  private toRow(expense: Expense): ExpenseRow {
    if (expense.nature === ExpenseNature.FIXED) {
      return {
        id: expense.id,
        date: expense.date,
        label: expense.label ?? '',
        detail: [expense.fixedType === FixedExpenseType.SALARY ? 'Salaire' : 'Charge', expense.detail].filter(Boolean).join(' · '),
        section: 'FIXED',
        sectionLabel: 'Fixe',
        sectionSeverity: 'secondary',
        paid: !!expense.paid,
        amount: expense.amount,
      };
    }
    const section = expense.category?.section ?? ExpenseSection.INGREDIENT;
    return {
      id: expense.id,
      date: expense.date,
      label: expense.category?.label ?? expense.ingredient?.label ?? '',
      detail: expense.note,
      section,
      sectionLabel: getSectionLabel(section),
      sectionSeverity: getSectionSeverity(section),
      paid: null,
      amount: expense.amount,
    };
  }

  /** "Mardi 24 novembre" from a YYYY-MM-DD date, without any timezone conversion. */
  private formatDay(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(year, month - 1, day))
      .replace(/^./, (c) => c.toUpperCase());
  }
}
