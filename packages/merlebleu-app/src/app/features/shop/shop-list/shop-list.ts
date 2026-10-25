import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Shop, CreateShopDto, UpdateShopDto, createShopSchema, updateShopSchema } from '@merlebleu/shared';
import { ShopService } from './shop.service';

@Component({
  selector: 'mb-shop-list',
  templateUrl: './shop-list.html',
  providers: [ShopService],
  imports: [ButtonModule, TableModule, Dialog, InputTextModule, FormsModule],
})
export class ShopListComponent implements OnInit {
  private shopService = inject(ShopService);

  shops = signal<Shop[]>([]);
  isLoading = signal(false);

  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  selectedShop: Shop | null = null;
  addAddress = '';
  editAddress = '';
  addError = '';
  editError = '';

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.isLoading.set(true);
    this.shopService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({ next: (shops) => this.shops.set(shops) });
  }

  openAdd() {
    this.addAddress = '';
    this.addError = '';
    this.showAddModal = true;
  }

  submitAdd() {
    const result = createShopSchema.safeParse({ address: this.addAddress });
    if (!result.success) {
      this.addError = result.error.issues[0]?.message ?? '';
      return;
    }
    const dto: CreateShopDto = result.data;
    this.shopService.create(dto).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadShops();
      },
    });
  }

  openEdit(shop: Shop) {
    this.selectedShop = shop;
    this.editAddress = shop.address;
    this.editError = '';
    this.showEditModal = true;
  }

  submitEdit() {
    const result = updateShopSchema.safeParse({ address: this.editAddress });
    if (!result.success) {
      this.editError = result.error.issues[0]?.message ?? '';
      return;
    }
    const dto: UpdateShopDto = result.data;
    this.shopService.update(this.selectedShop!.id, dto).subscribe({
      next: () => {
        this.showEditModal = false;
        this.loadShops();
      },
    });
  }

  openDelete(shop: Shop) {
    this.selectedShop = shop;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    this.shopService.delete(this.selectedShop!.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.loadShops();
      },
    });
  }
}
