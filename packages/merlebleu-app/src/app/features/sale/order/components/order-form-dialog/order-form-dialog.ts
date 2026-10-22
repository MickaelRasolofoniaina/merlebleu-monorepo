import { Component, ViewChild, input, model, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { CreateOrderDto, UpdateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../order-form/order-form';

@Component({
  selector: 'order-form-dialog',
  imports: [DialogModule, OrderForm],
  templateUrl: './order-form-dialog.html',
  styleUrl: './order-form-dialog.scss',
})
export class OrderFormDialog {
  @ViewChild(OrderForm) private orderForm!: OrderForm;

  orderData = input<CreateOrderDto | UpdateOrderDto | undefined>(undefined);
  isEdit = input(false);
  isLoading = input(false);
  visible = model(false);

  orderSubmit = output<CreateOrderDto | UpdateOrderDto>();

  protected get header(): string {
    return this.isEdit() ? 'Modifier commande' : 'Nouvelle commande';
  }

  public resetForm(): void {
    this.orderForm.reset();
  }
}
