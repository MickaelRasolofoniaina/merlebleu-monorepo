import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UpdateOrderDto } from '@merlebleu/shared';
import { OrderForm } from '../../components/order-form/order-form';
import { OrderService } from '../../order.service';

@Component({
  selector: 'edit-order',
  imports: [OrderForm],
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
    // TODO: Implement order fetching logic from your service
    // Example:
    // this.orderService.getOrderById(orderId).subscribe((order) => {
    //   this.order = order;
    // });

    // Mock data for demonstration
    setTimeout(() => {
      this.order = {
        orderDate: new Date('2026-02-01'),
        customerName: 'Jean Dupont',
        customerPhoneNumber: '0341234567',
        customerFacebookName: 'jean.dupont',
        deliveryDate: new Date('2026-02-15'),
        deliveryAddress: '123 Rue de la Paix, Antananarivo',
        isFromFacebook: true,
        orderItems: [
          {
            description: 'Forêt noire',
            size: 8,
            totalAmount: 50000,
            remarks: 'Avec des cerises fraîches',
            photos: [],
          },
        ],
        remarks: 'Livraison avant 14h',
        totalAmount: 50000,
        paidAmount: 25000,
        balanceAmount: 25000,
        paymentMethodId: 'ea732f9c-70eb-484f-a071-574bf9465f14',
      };
    }, 500);
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
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('Error updating order:', err);
        },
      });
  }

  protected handleReset(): void {
    console.log('Form reset');
  }
}
