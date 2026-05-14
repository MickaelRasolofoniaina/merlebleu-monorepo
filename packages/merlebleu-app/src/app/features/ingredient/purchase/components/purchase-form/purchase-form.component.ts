import { Component, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateIngredientPurchaseDto,
  Ingredient,
  UpdateIngredientPurchaseDto,
  createIngredientPurchaseSchema,
  updateIngredientPurchaseSchema,
} from '@merlebleu/shared';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { parseDate } from '@shared/utils/date';

@Component({
  selector: 'mb-purchase-form',
  templateUrl: './purchase-form.component.html',
  standalone: true,
  imports: [FormsModule, InputNumberModule, SelectModule, DatePickerModule],
})
export class PurchaseFormComponent implements OnChanges {
  itemData = input<CreateIngredientPurchaseDto | UpdateIngredientPurchaseDto | null>(null);
  formId = input('purchase-form');
  ingredients = input<Ingredient[]>([]);
  itemSubmit = output<CreateIngredientPurchaseDto | UpdateIngredientPurchaseDto>();

  validationError: ReturnType<typeof createIngredientPurchaseSchema.safeParse>['error'] | null =
    null;

  item: { purchaseDate: Date | null; ingredientId: string; quantity: number } = this.createEmpty();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      const data = this.itemData();
      this.item = data
        ? { purchaseDate: parseDate(data.purchaseDate as unknown as string), ingredientId: data.ingredientId, quantity: data.quantity }
        : this.createEmpty();
    }
  }

  onSubmit() {
    this.validationError = null;
    const schema = this.itemData() ? updateIngredientPurchaseSchema : createIngredientPurchaseSchema;
    const result = schema.safeParse({
      purchaseDate: this.item.purchaseDate,
      ingredientId: this.item.ingredientId,
      quantity: this.item.quantity,
    });

    if (!result.success) {
      this.validationError = result.error;
      return;
    }

    this.itemSubmit.emit({ ...result.data });
    this.resetForm();
  }

  getFieldError(field: keyof CreateIngredientPurchaseDto): string {
    return (
      this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? ''
    );
  }

  private resetForm(): void {
    this.validationError = null;
    this.item = this.createEmpty();
  }

  private createEmpty() {
    return { purchaseDate: null, ingredientId: '', quantity: 0 };
  }
}
