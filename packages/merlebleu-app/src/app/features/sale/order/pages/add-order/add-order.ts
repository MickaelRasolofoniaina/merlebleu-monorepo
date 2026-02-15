import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CreateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../../components/order-form/order-form';
import { OrderService } from '../../order.service';

@Component({
  selector: 'add-order',
  imports: [OrderForm],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected isLoading = false;

  protected handleSubmit(order: CreateOrderDto): void {
    this.isLoading = true;

    this.orderService
      .addOrder(order)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('Error creating order:', err);
        },
      });
  }

  protected handleReset(): void {
    console.log('Form reset');
  }
}
