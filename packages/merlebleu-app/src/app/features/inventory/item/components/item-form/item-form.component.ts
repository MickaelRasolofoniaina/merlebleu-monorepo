import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateItemDto,
  ItemType,
  UpdateItemDto,
  createItemSchema,
  updateItemSchema,
} from '@merlebleu/shared';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'mb-item-form',
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss'],
  standalone: true,
  imports: [FormsModule, InputTextModule, InputNumberModule, SelectModule],
})
export class ItemFormComponent {
  @Input() itemData?: CreateItemDto | UpdateItemDto | null;
  @Input() formId = 'item-form';
  @Output() itemSubmit = new EventEmitter<CreateItemDto | UpdateItemDto>();
  validationError: ReturnType<typeof createItemSchema.safeParse>['error'] | null = null;

  item: CreateItemDto | UpdateItemDto = {
    label: '',
    unitPrice: 0,
    type: ItemType.PASTRY,
    maxRetentionDays: 0,
  };

  itemTypes = Object.values(ItemType);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData']) {
      this.validationError = null;
      this.item = this.itemData ? { ...this.itemData } : this.createEmptyItem();
    }
  }

  onSubmit() {
    this.validationError = null;
    const schema = this.itemData ? updateItemSchema : createItemSchema;
    const validation = schema.safeParse(this.item);

    if (!validation.success) {
      this.validationError = validation.error;
      return;
    }

    this.itemSubmit.emit({ ...validation.data });
    this.resetForm();
  }

  getFieldError(field: 'label' | 'unitPrice' | 'type' | 'maxRetentionDays'): string {
    return this.validationError?.issues.find((issue) => issue.path[0] === field)?.message ?? '';
  }

  private resetForm(): void {
    this.validationError = null;
    this.item = this.createEmptyItem();
  }

  private createEmptyItem(): CreateItemDto {
    return {
      label: '',
      unitPrice: 0,
      type: ItemType.PASTRY,
      maxRetentionDays: 0,
    };
  }
}
