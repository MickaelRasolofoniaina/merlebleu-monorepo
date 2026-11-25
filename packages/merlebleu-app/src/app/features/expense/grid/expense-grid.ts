import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ExpenseSection } from '@merlebleu/shared';
import { formatUnitPrice } from '@shared/utils/number';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { MonthSwitcherComponent } from '../components/month-switcher/month-switcher';
import { CellTarget, ExpenseStoreService } from '../expense-store.service';
import { EXPENSE_SECTIONS, dayOfDate } from '../expense.model';

interface GridRow {
  /** Unique row key: `category:<id>` or `ingredient:<id>`. */
  key: string;
  target: CellTarget;
  label: string;
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
  rowKey: string;
  day: number;
}

const CELL_BASE =
  'w-full min-h-9 text-right px-2 py-1.5 cursor-pointer tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 hover:ring-2 hover:ring-inset hover:ring-blue-400 dark:hover:ring-blue-400';
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

  constructor() {
    // Bring today's column into view whenever the displayed days change (page load, month or day filter).
    effect(() => {
      this.dayColumns();
      afterNextRender(() => this.scrollToToday(), { injector: this.injector });
    });
  }

  protected readonly groups = computed<GridGroup[]>(() => {
    const amountsByRow = new Map<string, Map<number, number>>();
    for (const expense of this.store.variableExpenses()) {
      const key = this.rowKeyOf(expense.category?.id, expense.ingredient?.id);
      const amounts = amountsByRow.get(key) ?? new Map<number, number>();
      const day = dayOfDate(expense.date);
      amounts.set(day, (amounts.get(day) ?? 0) + expense.amount);
      amountsByRow.set(key, amounts);
    }

    const search = this.search().trim().toLowerCase();
    const sectionFilter = this.sectionFilter();
    const visibleDays = new Set(this.days());

    return EXPENSE_SECTIONS.filter((s) => !sectionFilter || s.value === sectionFilter)
      .map((section) => {
        const rows = this.sectionRows(section.value)
          .filter((row) => !search || row.label.toLowerCase().includes(search))
          .map((row) => {
            const amounts = amountsByRow.get(row.key) ?? new Map<number, number>();
            let total = 0;
            amounts.forEach((value, day) => {
              if (visibleDays.has(day)) total += value;
            });
            return { ...row, amounts, total };
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
    const totals: Record<ExpenseSection, number> = {
      [ExpenseSection.CURRENT]: 0,
      [ExpenseSection.INGREDIENT]: 0,
      [ExpenseSection.OTHER]: 0,
    };
    for (const expense of this.store.variableExpenses()) {
      totals[expense.category?.section ?? ExpenseSection.INGREDIENT] += expense.amount;
    }
    return totals;
  });

  /** Fixed expenses are not part of the grid: they have their own page. */
  protected readonly grandTotal = computed(() => {
    const t = this.sectionTotals();
    return t.CURRENT + t.INGREDIENT + t.OTHER;
  });

  // In-place cell editing.
  protected readonly editing = signal<CellRef | null>(null);
  protected readonly draft = signal('');
  /** Last focused cell: highlights its row and column, and is the grid's single tab stop. */
  protected readonly active = signal<CellRef | null>(null);

  /** Cell under the mouse: highlights its row label and day header, like a crosshair. */
  protected readonly hovered = signal<CellRef | null>(null);

  protected setHovered(rowKey: string, day: number): void {
    this.hovered.set({ rowKey, day });
  }

  protected clearHovered(): void {
    this.hovered.set(null);
  }

  protected isHoveredRow(rowKey: string): boolean {
    return this.hovered()?.rowKey === rowKey;
  }

  protected isHoveredDay(day: number): boolean {
    return this.hovered()?.day === day;
  }

  protected isEditing(rowKey: string, day: number): boolean {
    const cell = this.editing();
    return cell?.rowKey === rowKey && cell.day === day;
  }

  protected isActiveRow(rowKey: string): boolean {
    return this.active()?.rowKey === rowKey;
  }

  protected isActiveDay(day: number): boolean {
    return this.active()?.day === day;
  }

  protected isTabStop(rowKey: string, day: number): boolean {
    const cell = this.active() ?? this.firstCell();
    return cell?.rowKey === rowKey && cell.day === day;
  }

  protected cellClass(hasValue: boolean, column: DayColumn): string {
    if (hasValue) return `${CELL_BASE} ${CELL_FILLED}`;
    return `${CELL_BASE} ${column.isWeekend ? CELL_EMPTY_WEEKEND : CELL_EMPTY}`;
  }

  protected setActive(rowKey: string, day: number): void {
    this.active.set({ rowKey, day });
  }

  protected onCellKeydown(event: KeyboardEvent, row: GridRow, day: number): void {
    const rowKey = row.key;
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

    if (event.key === 'Enter' || event.key === 'F2') {
      this.startEdit(row, day);
    } else if (/^\d$/.test(event.key) && !hasModifier) {
      this.startEdit(row, day, event.key);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      this.store.setCell(row.target, day, 0);
    } else if ((event.key === 'd' || event.key === 'D') && event.ctrlKey) {
      this.copyFromAbove(rowKey, day);
    } else if (event.key === 'ArrowUp') {
      this.move(rowKey, day, -1, 0);
    } else if (event.key === 'ArrowDown') {
      this.move(rowKey, day, 1, 0);
    } else if (event.key === 'ArrowLeft') {
      this.move(rowKey, day, 0, -1);
    } else if (event.key === 'ArrowRight') {
      this.move(rowKey, day, 0, 1);
    } else {
      return;
    }
    event.preventDefault();
  }

  protected onInputKeydown(event: KeyboardEvent, row: GridRow, day: number): void {
    const rowKey = row.key;

    if (event.key === 'Escape') {
      this.editing.set(null);
      this.focusCell(rowKey, day);
    } else if (event.key === 'Enter' || event.key === 'ArrowDown') {
      this.commit();
      this.move(rowKey, day, event.shiftKey ? -1 : 1, 0);
    } else if (event.key === 'ArrowUp') {
      this.commit();
      this.move(rowKey, day, -1, 0);
    } else if (event.key === 'Tab') {
      this.commit();
      this.move(rowKey, day, 0, event.shiftKey ? -1 : 1, true);
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
    const row = this.flatRows().find((r) => r.key === cell.rowKey);
    if (row && amount !== (row.amounts.get(cell.day) ?? 0)) {
      this.store.setCell(row.target, cell.day, amount);
    }
  }

  protected startEdit(row: GridRow, day: number, initial?: string): void {
    const current = row.amounts.get(day);
    this.draft.set(initial ?? (current ? String(current) : ''));
    this.editing.set({ rowKey: row.key, day });
    this.setActive(row.key, day);
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

  private copyFromAbove(rowKey: string, day: number): void {
    const rows = this.flatRows();
    const index = rows.findIndex((row) => row.key === rowKey);
    const amount = index > 0 ? rows[index - 1].amounts.get(day) : undefined;
    if (amount) {
      this.store.setCell(rows[index].target, day, amount);
    }
  }

  private firstCell(): CellRef | null {
    const row = this.flatRows()[0];
    const day = this.days()[0];
    return row && day !== undefined ? { rowKey: row.key, day } : null;
  }

  private move(rowKey: string, day: number, rowDelta: number, dayDelta: number, wrap = false): void {
    const rows = this.flatRows();
    const days = this.days();
    let r = rows.findIndex((row) => row.key === rowKey);
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
    this.focusCell(rows[r].key, days[c]);
  }

  private focusCell(rowKey: string, day: number): void {
    const focus = (): boolean => {
      const button = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `button[data-cell="${CSS.escape(rowKey)}|${day}"]`,
      );
      button?.focus();
      return !!button;
    };
    // The button is missing while its cell is still showing the input: wait for the next render.
    if (!focus()) {
      afterNextRender(() => focus(), { injector: this.injector });
    }
  }

  /** Centers today's column in the horizontally scrollable grid. Does nothing outside the current month. */
  private scrollToToday(): void {
    const container = this.host.nativeElement.querySelector<HTMLElement>('[data-grid-scroll]');
    const header = container?.querySelector<HTMLElement>('th[aria-current="date"]');
    if (!container || !header) return;
    const offset = header.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollLeft += offset - (container.clientWidth - header.offsetWidth) / 2;
  }

  private rowKeyOf(categoryId?: string, ingredientId?: string): string {
    return categoryId ? `category:${categoryId}` : `ingredient:${ingredientId}`;
  }

  /** Rows of a section: the categories for CURRENT / OTHER, the ingredients for INGREDIENT. */
  private sectionRows(section: ExpenseSection): Omit<GridRow, 'amounts' | 'total'>[] {
    if (section === ExpenseSection.INGREDIENT) {
      return this.sortByLabel(
        this.store.ingredients().map((ingredient) => ({
          key: this.rowKeyOf(undefined, ingredient.id),
          target: { ingredientId: ingredient.id },
          label: ingredient.label,
        })),
      );
    }
    return this.sortByLabel(
      this.store
        .categories()
        .filter((category) => category.section === section)
        .map((category) => ({
          key: this.rowKeyOf(category.id),
          target: { categoryId: category.id },
          label: category.label,
        })),
    );
  }

  /** Ascending order on the designation, ignoring case and accents. */
  private sortByLabel<T extends { label: string }>(rows: T[]): T[] {
    return rows.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  }
}
