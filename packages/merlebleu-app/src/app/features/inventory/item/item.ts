import {
  CreateItemDto,
  CreateOrderDto,
  DEFAULT_PAGE_SIZE,
  Item,
  ItemType,
  UpdateItemDto,
} from '@merlebleu/shared';
import { Component, signal, inject } from '@angular/core';
import { ItemService } from './item.service';

import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { TablePageEvent } from 'primeng/table';
import { DecimalPipe } from '@angular/common';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { ItemFormComponent } from './components/item-form/item-form.component';

@Component({
  selector: 'mb-item-list',
  templateUrl: './item.html',
  styleUrls: ['./item.scss'],
  providers: [ItemService],
  imports: [Button, TableModule, Dialog, DecimalPipe, ItemFormComponent],
})
export class ItemListComponent {
  items = signal<Item[]>([]);
  search = signal('');
  page = signal(1);
  rows = DEFAULT_PAGE_SIZE;
  first = signal(0);
  totalRecords = signal(0);
  isLoading = signal(false);
  showModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedItem: Item | null = null;

  addItemDto: CreateItemDto = {
    label: '',
    unitPrice: 0,
    type: ItemType.PASTRY,
    maxRetentionDays: 0,
  };

  updateItemDto: UpdateItemDto = {
    label: '',
    unitPrice: 0,
    type: ItemType.PASTRY,
    maxRetentionDays: 0,
  };

  private itemService = inject(ItemService);

  ngOnInit() {
    this.fetchItems();
  }

  fetchItems() {
    this.isLoading.set(true);
    this.itemService
      .getItems(this.search(), this.page(), this.rows)
      .subscribe(({ items, total }) => {
        this.items.set(items);
        this.totalRecords.set(total);
        this.isLoading.set(false);
      });
  }

  onSearchChange(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.fetchItems();
  }

  onTablePage(event: TablePageEvent) {
    // PrimeNG Table uses zero-based page index
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchItems();
  }

  openAddModal() {
    this.selectedItem = null;
    this.showModal = true;
  }

  openEditModal(item: Item) {
    this.selectedItem = item;
    this.showEditModal = true;
  }

  openDeleteModal(item: Item) {
    this.selectedItem = item;
    this.showDeleteModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedItem = null;
  }

  addItem(item: CreateItemDto) {
    this.itemService.addItem(item).subscribe(() => {
      this.closeModal();
      this.fetchItems();
    });
  }

  editItem(id: string, item: UpdateItemDto) {
    this.itemService.editItem(id, item).subscribe(() => {
      this.closeModal();
      this.fetchItems();
    });
  }

  deleteItem(id: string) {
    this.itemService.deleteItem(id).subscribe(() => {
      this.closeModal();
      this.fetchItems();
    });
  }
}
