import { Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CreateStockEntriesDto,
  Ingredient,
  StockEntryUnit,
  createStockEntriesSchema,
} from '@merlebleu/shared';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { capitalizeFirstLetter } from '@shared/utils/text';
import { buildZodErrorMap } from '@shared/utils/zod-errors';

interface BatchLine {
  key: number;
  ingredientId: string | null;
  quantity: number | null;
  /** Unit the quantity is typed in: the entry unit (bag) when the ingredient has one, else the stock unit. */
  unit: StockEntryUnit;
}

/** Adds stock for several ingredients at once, with one date shared by every line. */
@Component({
  selector: 'mb-stock-entry-batch',
  templateUrl: './stock-entry-batch.component.html',
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    SelectModule,
  ],
})
export class StockEntryBatchComponent {
  readonly capitalizeFirstLetter = capitalizeFirstLetter;

  ingredients = input<Ingredient[]>([]);
  isSubmitting = input(false);
  batchSubmit = output<CreateStockEntriesDto>();

  // Declared before `lines`: the field initializers run in order and createLine() reads it
  private nextKey = 1;

  entryDate = signal<Date | null>(new Date());
  lines = signal<BatchLine[]>([this.createLine()]);
  errors = signal<Record<string, string>>({});

  readonly readyCount = computed(() => this.lines().filter((line) => this.isReady(line)).length);

  readonly summary = computed(() => {
    const count = this.readyCount();
    return count ? `${count} ligne${count > 1 ? 's' : ''} prête${count > 1 ? 's' : ''}` : '';
  });

  /** An ingredient already picked on another line is not offered again. */
  optionsFor(line: BatchLine): Ingredient[] {
    const used = new Set(
      this.lines()
        .filter((other) => other.key !== line.key && other.ingredientId)
        .map((other) => other.ingredientId),
    );
    return this.ingredients().filter((ingredient) => !used.has(ingredient.id));
  }

  ingredientOf(line: BatchLine): Ingredient | undefined {
    return this.ingredients().find((ingredient) => ingredient.id === line.ingredientId);
  }

  /** True when the ingredient is received in another unit than the one of its stock (a bag of flour). */
  hasEntryUnit(ingredient: Ingredient | undefined): boolean {
    return !!ingredient?.entryUnit && Number(ingredient.entryUnitFactor) > 0;
  }

  unitOptions(ingredient: Ingredient): { value: StockEntryUnit; label: string }[] {
    return [
      { value: 'entry', label: ingredient.entryUnit?.label ?? '' },
      { value: 'stock', label: ingredient.unit.label },
    ];
  }

  /** True when the line is typed in the entry unit, so the converted quantity is worth showing. */
  isConverted(line: BatchLine): boolean {
    return line.unit === 'entry' && this.hasEntryUnit(this.ingredientOf(line));
  }

  /** Quantity added to the stock, in the stock unit. Null while the line has no usable quantity. */
  convertedQuantity(line: BatchLine): number | null {
    const ingredient = this.ingredientOf(line);
    if (!ingredient || !line.quantity || line.quantity <= 0) return null;
    const factor = this.isConverted(line) ? Number(ingredient.entryUnitFactor) : 1;
    return Math.round(line.quantity * factor * 100) / 100;
  }

  stockAfter(line: BatchLine): number | null {
    const ingredient = this.ingredientOf(line);
    const converted = this.convertedQuantity(line);
    return ingredient && converted !== null ? Number(ingredient.stock) + converted : null;
  }

  /** Picking an ingredient selects its entry unit by default, when it has one. */
  onIngredientChange(key: number, ingredientId: string | null) {
    const ingredient = this.ingredients().find((item) => item.id === ingredientId);
    this.patchLine(key, {
      ingredientId,
      unit: this.hasEntryUnit(ingredient) ? 'entry' : 'stock',
    });
  }

  lineError(index: number, field: 'ingredientId' | 'quantity'): string {
    return this.errors()[`lines.${index}.${field}`] ?? '';
  }

  patchLine(key: number, patch: Partial<Omit<BatchLine, 'key'>>) {
    this.lines.update((lines) =>
      lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  addLine() {
    this.lines.update((lines) => [...lines, this.createLine()]);
  }

  removeLine(key: number) {
    this.lines.update((lines) => {
      const remaining = lines.filter((line) => line.key !== key);
      return remaining.length ? remaining : [this.createLine()];
    });
  }

  onQuantityEnter(event: Event) {
    event.preventDefault();
    this.addLine();
  }

  onSubmit() {
    // Blank lines are ignored: only lines with an ingredient or a quantity are validated
    const filled = this.lines().filter((line) => line.ingredientId || line.quantity);
    const result = createStockEntriesSchema.safeParse({
      entryDate: this.entryDate(),
      lines: filled.map((line) => ({
        ingredientId: line.ingredientId ?? '',
        quantity: line.quantity,
        unit: line.unit,
      })),
    });

    if (!result.success) {
      const map = buildZodErrorMap(result.error.issues);
      // Re-key the errors on the position of the line in the full list
      const positions = this.lines()
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.ingredientId || line.quantity)
        .map(({ index }) => index);
      const remapped: Record<string, string> = {};
      for (const [key, message] of Object.entries(map)) {
        const match = /^lines\.(\d+)\.(.+)$/.exec(key);
        remapped[match ? `lines.${positions[Number(match[1])]}.${match[2]}` : key] = message;
      }
      this.errors.set(remapped);
      return;
    }

    this.errors.set({});
    this.batchSubmit.emit(result.data);
  }

  /** Called by the parent once the batch is saved. */
  reset() {
    this.errors.set({});
    this.lines.set([this.createLine()]);
  }

  private isReady(line: BatchLine): boolean {
    return !!line.ingredientId && !!line.quantity && line.quantity > 0;
  }

  private createLine(): BatchLine {
    return { key: this.nextKey++, ingredientId: null, quantity: null, unit: 'stock' };
  }
}
