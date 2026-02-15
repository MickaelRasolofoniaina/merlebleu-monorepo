import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { SelectModule } from 'primeng/select';

import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderItemDto,
  PaymentMethod,
  createOrderSchema,
} from '@merlebleu/shared';
import { buildZodErrorMap } from '@shared/utils/zod-errors';
import { PaymentService } from '@features/sale/payment/payment.service';

@Component({
  selector: 'order-form',
  imports: [
    DatePickerModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    InputNumberModule,
    ButtonModule,
    FieldsetModule,
    SelectModule,
    CommonModule,
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm implements OnInit, OnChanges {
  @Input() orderData?: CreateOrderDto | UpdateOrderDto;
  @Input() isLoading = false;
  @Output() orderSubmit = new EventEmitter<CreateOrderDto | UpdateOrderDto>();
  @Output() orderReset = new EventEmitter<void>();

  protected order: CreateOrderDto | UpdateOrderDto = this.buildDefaultOrder();

  protected orderDateValue: Date | null = null;
  protected deliveryDateValue: Date | null = null;

  protected validationErrors: Record<string, string> = {};

  protected paymentMethods: PaymentMethod[] = [];

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.syncDateValuesFromOrder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderData'] && this.orderData) {
      this.order = this.deepCopyOrder(this.orderData);
      this.syncDateValuesFromOrder();
    }
  }

  protected loadPaymentMethods(): void {
    this.paymentService.getAllPaymentMethods().subscribe((methods) => {
      this.paymentMethods = methods;
    });
  }

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
    this.orderSubmit.emit(this.order);
  }

  protected reset(): void {
    if (this.orderData) {
      this.order = this.deepCopyOrder(this.orderData);
    } else {
      this.order = this.buildDefaultOrder();
    }
    this.syncDateValuesFromOrder();
    this.validationErrors = {};
    this.orderReset.emit();
  }

  protected onOrderDateChange(value: Date | null): void {
    this.orderDateValue = value;
    this.order.orderDate = this.formatIsoDate(value);
  }

  protected onDeliveryDateChange(value: Date | null): void {
    this.deliveryDateValue = value;
    this.order.deliveryDate = this.formatIsoDate(value);
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected errorFor(path: string): string | null {
    return this.validationErrors[path] ?? null;
  }

  private buildDefaultOrder(): CreateOrderDto {
    return {
      orderDate: new Date().toISOString(),
      customerName: '',
      customerPhoneNumber: '',
      customerFacebookName: '',
      deliveryDate: new Date().toISOString(),
      deliveryAddress: '',
      isFromFacebook: false,
      orderItems: [this.buildOrderItem()],
      remarks: '',
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      paymentMethodId: '',
    };
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

  private deepCopyOrder(dto: CreateOrderDto | UpdateOrderDto): CreateOrderDto | UpdateOrderDto {
    return {
      ...dto,
      orderItems: dto.orderItems.map((item) => ({ ...item })),
    };
  }

  private syncDateValuesFromOrder(): void {
    this.orderDateValue = this.parseIsoDate(this.order.orderDate);
    this.deliveryDateValue = this.parseIsoDate(this.order.deliveryDate);
  }

  private parseIsoDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatIsoDate(value: Date | null): string {
    return value ? value.toISOString() : '';
  }
}
