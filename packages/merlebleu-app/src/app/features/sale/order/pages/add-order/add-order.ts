import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CreateOrderDto, UpdateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../../components/order-form/order-form';
import { OrderService } from '../../order.service';

@Component({
  selector: 'add-order',
  imports: [ButtonModule, RouterLink, OrderForm],
  templateUrl: './add-order.html',
  styleUrl: './add-order.scss',
})
export class AddOrder {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);

  protected handleOrderSubmit(order: CreateOrderDto | UpdateOrderDto): void {
    this.isLoading.set(true);

    this.orderService
      .addOrder(order as CreateOrderDto)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/sale/order/list']);
        },
      });
  }
}
