import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UpdateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../../components/order-form/order-form';
import { OrderService } from '../../order.service';

@Component({
  selector: 'edit-order',
  imports: [OrderForm, RouterLink],
  templateUrl: './edit-order.html',
  styleUrl: './edit-order.scss',
})
export class EditOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  protected order?: UpdateOrderDto;
  protected isLoading = false;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  private loadOrder(orderId: string): void {
    this.isLoading = true;

    this.orderService
      .getOrderById(orderId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (order) => {
          this.order = {
            ...order,
            paymentMethodId: order.paymentMethod?.id ?? '',
          } as UpdateOrderDto;
        },
      });
  }

  protected handleSubmit(order: UpdateOrderDto): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      return;
    }

    this.isLoading = true;

    this.orderService
      .updateOrder(orderId, order)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/sale/order']);
        },
      });
  }
}
