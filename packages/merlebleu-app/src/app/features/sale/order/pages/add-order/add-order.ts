import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { DropdownModule } from 'primeng/dropdown';

import { CreateOrderDto, OrderItemDto, createOrderSchema } from '@merlebleu/shared';
import { buildZodErrorMap } from '@shared/utils/zod-errors';

@Component({
  selector: 'add-order',
  imports: [
    DatePickerModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    InputNumberModule,
    ButtonModule,
    FieldsetModule,
    DropdownModule,
    CommonModule,
  ],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  protected order: CreateOrderDto = {
    orderDate: new Date(),
    customerName: '',
    customerPhoneNumber: '',
    customerFacebookName: '',
    deliveryDate: new Date(),
    deliveryAddress: '',
    isFromFacebook: false,
    orderItems: [this.buildOrderItem()],
    remarks: '',
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    paymentMethodId: '',
  };

  protected validationErrors: Record<string, string> = {};

  protected paymentMethodOptions = [
    { label: 'Especes', value: 'cash' },
    { label: 'Mobile money', value: 'mobile_money' },
    { label: 'Carte bancaire', value: 'card' },
  ];

  protected addOrderItem(): void {
    this.order.orderItems.push(this.buildOrderItem());
  }

  protected removeOrderItem(index: number): void {
    if (this.order.orderItems.length <= 1) {
      return;
    }

    this.order.orderItems.splice(index, 1);
    this.syncTotalFromItems();
  }

  protected syncTotalFromItems(): void {
    this.order.totalAmount = this.order.orderItems.reduce(
      (sum, item) => sum + (Number(item.totalAmount) || 0),
      0,
    );
    this.updateBalanceAmount();
  }

  protected updateBalanceAmount(): void {
    const total = Number(this.order.totalAmount) || 0;
    const paid = Number(this.order.paidAmount) || 0;
    this.order.balanceAmount = Math.max(total - paid, 0);
  }

  protected submit(): void {
    this.validationErrors = {};
    const result = createOrderSchema.safeParse(this.order);
    if (!result.success) {
      this.validationErrors = buildZodErrorMap(result.error.issues);
      return;
    }

    this.updateBalanceAmount();
  }

  protected reset(): void {
    this.order = {
      orderDate: new Date(),
      customerName: '',
      customerPhoneNumber: '',
      customerFacebookName: '',
      deliveryDate: new Date(),
      deliveryAddress: '',
      isFromFacebook: false,
      orderItems: [this.buildOrderItem()],
      remarks: '',
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      paymentMethodId: '',
    };
    this.validationErrors = {};
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected errorFor(path: string): string | null {
    return this.validationErrors[path] ?? null;
  }

  private buildOrderItem(): OrderItemDto {
    return {
      description: '',
      size: 0,
      totalAmount: 0,
      remarks: '',
      photos: [],
    };
  }
}
