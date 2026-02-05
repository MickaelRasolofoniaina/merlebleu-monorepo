import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PaymentMethod } from '@merlebleu/shared';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment',
  imports: [TableModule, ButtonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class Payment implements OnInit {
  private readonly paymentService = inject(PaymentService);
  paymentMethods: PaymentMethod[] = [];

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.paymentService.getAllPaymentMethods().subscribe({
      next: (data) => {
        this.paymentMethods = data;
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
      },
    });
  }

  addPaymentMethod(): void {
    console.log('Add payment method');
    // TODO: Open dialog to add payment method
  }

  editPaymentMethod(payment: PaymentMethod): void {
    console.log('Edit payment method:', payment);
    // TODO: Open dialog to edit payment method
  }

  deletePaymentMethod(payment: PaymentMethod): void {
    console.log('Delete payment method:', payment);
    // TODO: Implement delete functionality
  }
}
