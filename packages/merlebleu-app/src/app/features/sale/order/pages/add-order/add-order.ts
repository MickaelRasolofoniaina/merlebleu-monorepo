import { Component } from '@angular/core';

import { CreateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../../components/order-form/order-form';

@Component({
  selector: 'add-order',
  imports: [OrderForm],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  protected handleSubmit(order: CreateOrderDto): void {
    // TODO: Implement order creation logic
    console.log('Creating order:', order);
  }

  protected handleReset(): void {
    // TODO: Implement any additional reset logic if needed
    console.log('Form reset');
  }
}
