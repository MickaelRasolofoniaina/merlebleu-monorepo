import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateItemDto, ItemType, UpdateItemDto } from '@merlebleu/shared';

@Component({
  selector: 'mb-item-form',
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss'],
  standalone: true,
  imports: [FormsModule],
})
export class ItemFormComponent {
  @Input() itemData?: CreateItemDto | UpdateItemDto | null;
  @Output() itemSubmit = new EventEmitter<CreateItemDto | UpdateItemDto>();

  item: CreateItemDto | UpdateItemDto = {
    label: '',
    unitPrice: 0,
    type: ItemType.PASTRY,
    maxRetentionDays: 0,
  };

  itemTypes = Object.values(ItemType);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemData'] && this.itemData) {
      this.item = { ...this.itemData };
    }
  }

  onSubmit() {
    this.itemSubmit.emit(this.item);
  }
}
