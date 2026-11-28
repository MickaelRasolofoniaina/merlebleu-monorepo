import { Component, OnChanges, SimpleChanges, input, output } from '@angular/core';
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
  imports: [FormsModule, InputNumberModule, SelectModule, DatePickerModule],
})
export class StockEntryFormComponent implements OnChanges {
  itemData = input<UpdateStockEntryDto | null>(null);
  formId = input('stock-entry-form');
  ingredients = input<Ingredient[]>([]);
  itemSubmit = output<UpdateStockEntryDto>();

  validationError: ReturnType<typeof updateStockEntrySchema.safeParse>['error'] | null = null;

  item: { entryDate: Date | null; ingredientId: string; quantity: number } = this.createEmpty();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      const data = this.itemData();
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

  getFieldError(field: keyof UpdateStockEntryDto): string {
    return this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  private createEmpty() {
    return { entryDate: null, ingredientId: '', quantity: 0 };
  }
}
