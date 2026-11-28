import { Component, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Ingredient,
  UpdateStockEntryDto,
  updateStockEntrySchema,
} from '@merlebleu/shared';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { parseDate } from '@shared/utils/date';

/** Edits one existing stock entry (the batch entry is handled by StockEntryBatchComponent). */
@Component({
  selector: 'mb-stock-entry-form',
  templateUrl: './stock-entry-form.component.html',
  imports: [DecimalPipe, FormsModule, InputNumberModule, SelectModule, DatePickerModule],
})
export class StockEntryFormComponent implements OnChanges {
  itemData = input<UpdateStockEntryDto | null>(null);
  formId = input('stock-entry-form');
  ingredients = input<Ingredient[]>([]);
  /** Entry unit the entry was typed in ("sac"), null when it was typed in the stock unit. */
  enteredUnitLabel = input<string | null>(null);
  /** Stock units per entry unit at the time of the entry. */
  conversionFactor = input<number | null>(null);
  itemSubmit = output<UpdateStockEntryDto>();

  validationError: ReturnType<typeof updateStockEntrySchema.safeParse>['error'] | null = null;

  item: { entryDate: Date | null; ingredientId: string; quantity: number } = this.createEmpty();

  /** Ingredient of the entry when it was opened: the entry unit only holds for this one. */
  private originalIngredientId = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      const data = this.itemData();
      this.originalIngredientId = data?.ingredientId ?? '';
      this.item = data
        ? {
            entryDate: parseDate(data.entryDate),
            ingredientId: data.ingredientId,
            quantity: data.quantity,
          }
        : this.createEmpty();
    }
  }

  onSubmit() {
    this.validationError = null;
    const result = updateStockEntrySchema.safeParse({
      entryDate: this.item.entryDate,
      ingredientId: this.item.ingredientId,
      quantity: this.item.quantity,
    });

    if (!result.success) {
      this.validationError = result.error;
      return;
    }

    this.itemSubmit.emit({ ...result.data });
  }

  /** The unit of the typed quantity is frozen; moving the entry to another ingredient falls back to its stock unit. */
  keepsEntryUnit(): boolean {
    return (
      !!this.enteredUnitLabel() &&
      Number(this.conversionFactor()) > 0 &&
      this.item.ingredientId === this.originalIngredientId
    );
  }

  /** Stock unit of the selected ingredient. */
  stockUnitLabel(): string {
    return this.ingredients().find((ingredient) => ingredient.id === this.item.ingredientId)?.unit.label ?? '';
  }

  convertedQuantity(): number {
    return Math.round((this.item.quantity ?? 0) * Number(this.conversionFactor()) * 100) / 100;
  }

  getFieldError(field: keyof UpdateStockEntryDto): string {
    return this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  private createEmpty() {
    return { entryDate: null, ingredientId: '', quantity: 0 };
  }
}
