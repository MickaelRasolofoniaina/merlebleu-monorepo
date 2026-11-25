import { Component, ElementRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { formatUnitPrice } from '@shared/utils/number';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { MonthSwitcherComponent } from '../components/month-switcher/month-switcher';
import { ExpenseStoreService } from '../expense-store.service';
import { EXPENSE_SECTIONS, ExpenseCategory, ExpenseSection } from '../expense.model';

interface GridRow {
  category: ExpenseCategory;
  amounts: Map<number, number>;
  total: number;
}

interface GridGroup {
  section: ExpenseSection;
  label: string;
  rows: GridRow[];
  total: number;
}

interface DayColumn {
  day: number;
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
}

interface CellRef {
  categoryId: string;
  day: number;
}

const CELL_BASE =
  'w-full min-h-9 text-right px-2 py-1.5 cursor-pointer tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600';
const CELL_FILLED =
  'bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-50 dark:hover:bg-blue-800';
const CELL_EMPTY = 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800';
const CELL_EMPTY_WEEKEND = 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800';

@Component({
  selector: 'mb-expense-grid',
  templateUrl: './expense-grid.html',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, MonthSwitcherComponent, StatCard],
})
export class ExpenseGridComponent {
  protected readonly store = inject(ExpenseStoreService);
  private readonly messageService = inject(MessageService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly formatAmount = formatUnitPrice;
  protected readonly sectionOptions = [{ value: null, label: 'Toutes les sections' }, ...EXPENSE_SECTIONS];

  protected readonly sectionFilter = signal<ExpenseSection | null>(null);
  protected readonly search = signal('');

  protected readonly dayFilter = signal<number | null>(null);

  private readonly monthDays = computed(() =>
    Array.from({ length: this.store.daysInMonth() }, (_, i) => i + 1),
  );

  protected readonly dayOptions = computed(() => [
    { value: null, label: 'Tous les jours' },
    ...this.monthDays().map((day) => ({ value: day, label: `Jour ${day}` })),
  ]);

  /** Displayed days: the selected day only, or the whole month. A day past the end of the month is ignored. */
  protected readonly days = computed(() => {
    const day = this.dayFilter();
    return day !== null && day <= this.store.daysInMonth() ? [day] : this.monthDays();
  });

  /** Displayed days with their weekday and today / weekend flags, used by the header and the cells. */
  protected readonly dayColumns = computed<DayColumn[]>(() => {
    const year = this.store.year();
    const month = this.store.month();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    return this.days().map((day) => {
      const date = new Date(year, month, day);
      return {
        day,
        weekday: weekdayFormat.format(date).replace('.', ''),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: isCurrentMonth && now.getDate() === day,
      };
    });
  });

  protected readonly groups = computed<GridGroup[]>(() => {
    const amountsByCategory = new Map<string, Map<number, number>>();
    for (const expense of this.store.monthExpenses()) {
      const amounts = amountsByCategory.get(expense.categoryId) ?? new Map<number, number>();
      const day = expense.date.getDate();
      amounts.set(day, (amounts.get(day) ?? 0) + expense.amount);
      amountsByCategory.set(expense.categoryId, amounts);
    }

    const search = this.search().trim().toLowerCase();
    const sectionFilter = this.sectionFilter();
    const visibleDays = new Set(this.days());

    return EXPENSE_SECTIONS.filter((s) => !sectionFilter || s.value === sectionFilter)
      .map((section) => {
        const rows = this.store
          .categories()
          .filter((c) => c.section === section.value)
          .filter((c) => !search || c.label.toLowerCase().includes(search))
          .map((category) => {
            const amounts = amountsByCategory.get(category.id) ?? new Map<number, number>();
            let total = 0;
            amounts.forEach((value, day) => {
              if (visibleDays.has(day)) total += value;
            });
            return { category, amounts, total };
          });
        return {
          section: section.value,
          label: section.label,
          rows,
          total: rows.reduce((sum, r) => sum + r.total, 0),
        };
      })
      .filter((group) => group.rows.length > 0);
  });

  private readonly flatRows = computed(() => this.groups().flatMap((group) => group.rows));

  protected readonly dayTotals = computed(() => {
    const totals = new Map<number, number>();
    for (const group of this.groups()) {
      for (const row of group.rows) {
        row.amounts.forEach((value, day) => totals.set(day, (totals.get(day) ?? 0) + value));
      }
    }
    return totals;
  });

  protected readonly visibleTotal = computed(() => {
    const totals = this.dayTotals();
    return this.days().reduce((sum, day) => sum + (totals.get(day) ?? 0), 0);
  });

  protected readonly sectionTotals = computed(() => {
    const totals: Record<ExpenseSection, number> = { CURRENT: 0, INGREDIENT: 0, OTHER: 0 };
    for (const expense of this.store.monthExpenses()) {
      const category = this.store.getCategory(expense.categoryId);
      if (category) {
        totals[category.section] += expense.amount;
      }
    }
    return totals;
  });

  protected readonly fixedTotal = computed(() =>
    this.store.monthFixedExpenses().reduce((sum, e) => sum + e.amount, 0),
  );
  protected readonly variableTotal = computed(() => {
    const t = this.sectionTotals();
    return t.CURRENT + t.INGREDIENT + t.OTHER;
  });
  protected readonly grandTotal = computed(() => this.variableTotal() + this.fixedTotal());

  // In-place cell editing. All expenses entered in the grid are paid in cash.
  protected readonly editing = signal<CellRef | null>(null);
  protected readonly draft = signal('');
  /** Last focused cell: highlights its row and column, and is the grid's single tab stop. */
  protected readonly active = signal<CellRef | null>(null);

  protected isEditing(categoryId: string, day: number): boolean {
    const cell = this.editing();
    return cell?.categoryId === categoryId && cell.day === day;
  }

  protected isActiveRow(categoryId: string): boolean {
    return this.active()?.categoryId === categoryId;
  }

  protected isActiveDay(day: number): boolean {
    return this.active()?.day === day;
  }

  protected isTabStop(categoryId: string, day: number): boolean {
    const cell = this.active() ?? this.firstCell();
    return cell?.categoryId === categoryId && cell.day === day;
  }

  protected cellClass(hasValue: boolean, column: DayColumn): string {
    if (hasValue) return `${CELL_BASE} ${CELL_FILLED}`;
    return `${CELL_BASE} ${column.isWeekend ? CELL_EMPTY_WEEKEND : CELL_EMPTY}`;
  }

  protected setActive(categoryId: string, day: number): void {
    this.active.set({ categoryId, day });
  }

  protected onCellKeydown(event: KeyboardEvent, row: GridRow, day: number): void {
    const categoryId = row.category.id;
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    if (event.key === 'Enter' || event.key === 'F2') {
      this.startEdit(row, day);
    } else if (/^\d$/.test(event.key) && !hasModifier) {
      this.startEdit(row, day, event.key);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      this.store.setCell(categoryId, day, 0);
    } else if ((event.key === 'd' || event.key === 'D') && event.ctrlKey) {
      this.copyFromAbove(categoryId, day);
    } else if (event.key === 'ArrowUp') {
      this.move(categoryId, day, -1, 0);
    } else if (event.key === 'ArrowDown') {
      this.move(categoryId, day, 1, 0);
    } else if (event.key === 'ArrowLeft') {
      this.move(categoryId, day, 0, -1);
    } else if (event.key === 'ArrowRight') {
      this.move(categoryId, day, 0, 1);
    } else {
      return;
    }
    event.preventDefault();
  }

  protected onInputKeydown(event: KeyboardEvent, row: GridRow, day: number): void {
    const categoryId = row.category.id;

    if (event.key === 'Escape') {
      this.editing.set(null);
      this.focusCell(categoryId, day);
    } else if (event.key === 'Enter' || event.key === 'ArrowDown') {
      this.commit();
      this.move(categoryId, day, event.shiftKey ? -1 : 1, 0);
    } else if (event.key === 'ArrowUp') {
      this.commit();
      this.move(categoryId, day, -1, 0);
    } else if (event.key === 'Tab') {
      this.commit();
      this.move(categoryId, day, 0, event.shiftKey ? -1 : 1, true);
    } else {
      return;
    }
    event.preventDefault();
  }

  protected onDraftInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    input.value = digits;
    this.draft.set(digits);
  }

  protected commit(): void {
    const cell = this.editing();
    if (!cell) return;
    this.editing.set(null);
    const amount = Number(this.draft()) || 0;
    const previous = this.flatRows()
      .find((row) => row.category.id === cell.categoryId)
      ?.amounts.get(cell.day);
    if (amount !== (previous ?? 0)) {
      this.store.setCell(cell.categoryId, cell.day, amount);
    }
  }

  protected startEdit(row: GridRow, day: number, initial?: string): void {
    const base = row.amounts.get(day) ?? row.category.usualAmount;
    this.draft.set(initial ?? (base ? String(base) : ''));
    this.editing.set({ categoryId: row.category.id, day });
    this.setActive(row.category.id, day);
    afterNextRender(
      () => {
        const input = this.host.nativeElement.querySelector<HTMLInputElement>('input[data-editing]');
        if (!input) return;
        input.focus();
        if (initial === undefined) {
          input.select();
        } else {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      },
      { injector: this.injector },
    );
  }

  private copyFromAbove(categoryId: string, day: number): void {
    const rows = this.flatRows();
    const index = rows.findIndex((row) => row.category.id === categoryId);
    const amount = index > 0 ? rows[index - 1].amounts.get(day) : undefined;
    if (amount) {
      this.store.setCell(categoryId, day, amount);
    }
  }

  private firstCell(): CellRef | null {
    const row = this.flatRows()[0];
    const day = this.days()[0];
    return row && day !== undefined ? { categoryId: row.category.id, day } : null;
  }

  private move(categoryId: string, day: number, rowDelta: number, dayDelta: number, wrap = false): void {
    const rows = this.flatRows();
    const days = this.days();
    let r = rows.findIndex((row) => row.category.id === categoryId);
    let c = days.indexOf(day);
    if (r < 0 || c < 0) return;

    r += rowDelta;
    c += dayDelta;
    if (wrap && c >= days.length) {
      c = 0;
      r += 1;
    } else if (wrap && c < 0) {
      c = days.length - 1;
      r -= 1;
    }
    r = Math.min(Math.max(r, 0), rows.length - 1);
    c = Math.min(Math.max(c, 0), days.length - 1);
    this.focusCell(rows[r].category.id, days[c]);
  }

  private focusCell(categoryId: string, day: number): void {
    const focus = (): boolean => {
      const button = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `button[data-cell="${CSS.escape(categoryId)}|${day}"]`,
      );
      button?.focus();
      return !!button;
    };
    // The button is missing while its cell is still showing the input: wait for the next render.
    if (!focus()) {
      afterNextRender(() => focus(), { injector: this.injector });
    }
  }

  protected exportGrid(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Export Excel',
      detail: 'Disponible une fois les pages validées.',
    });
  }
}
