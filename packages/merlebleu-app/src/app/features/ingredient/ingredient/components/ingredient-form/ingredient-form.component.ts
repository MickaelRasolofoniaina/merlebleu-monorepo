import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateIngredientDto,
  IngredientCategory,
  IngredientUnit,
  UpdateIngredientDto,
  createIngredientSchema,
  updateIngredientSchema,
} from '@merlebleu/shared';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'mb-ingredient-form',
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
  standalone: true,
  imports: [FormsModule, InputTextModule, InputNumberModule, SelectModule],
})
export class IngredientFormComponent {
  @Input() itemData?: CreateIngredientDto | UpdateIngredientDto | null;
  @Input() formId = 'ingredient-form';
  @Input() categories: IngredientCategory[] = [];
  @Input() units: IngredientUnit[] = [];
  @Output() itemSubmit = new EventEmitter<CreateIngredientDto | UpdateIngredientDto>();

  validationError: ReturnType<typeof createIngredientSchema.safeParse>['error'] | null = null;

  item: CreateIngredientDto | UpdateIngredientDto = this.createEmpty();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      this.item = this.itemData ? { ...this.itemData } : this.createEmpty();
    }
  }

  onSubmit() {
    this.validationError = null;
    const schema = this.itemData ? updateIngredientSchema : createIngredientSchema;
    const result = schema.safeParse(this.item);

    if (!result.success) {
      this.validationError = result.error;
      return;
    }

    this.itemSubmit.emit({ ...result.data });
    this.resetForm();
  }

  getFieldError(field: keyof CreateIngredientDto): string {
    return this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  private resetForm(): void {
    this.validationError = null;
    this.item = this.createEmpty();
  }

  private createEmpty(): CreateIngredientDto {
    return { label: '', categoryId: '', unitId: '', unitPrice: 0 };
  }
}
