import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PaymentMethod, createPaymentMethodSchema } from '@merlebleu/shared';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment',
  imports: [TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class Payment implements OnInit {
  private readonly paymentService = inject(PaymentService);
  paymentMethods: PaymentMethod[] = [];
  displayModal = false;
  newPaymentMethodName = '';
  validationError = '';

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
    this.newPaymentMethodName = '';
    this.validationError = '';
    this.displayModal = true;
  }

  confirmAddPaymentMethod(): void {
    this.validationError = '';

    const validation = createPaymentMethodSchema.safeParse({
      name: this.newPaymentMethodName,
    });

    console.log(this.newPaymentMethodName, 'methode de paiement');
    console.log(validation, 'validation');

    if (!validation.success) {
      this.validationError = validation.error.issues.map((issue) => issue.message).join(', ');
      return;
    }

    this.paymentService.addPaymentMethod({ name: this.newPaymentMethodName }).subscribe({
      next: () => {
        this.loadPaymentMethods();
        this.displayModal = false;
        this.newPaymentMethodName = '';
        this.validationError = '';
      },
      error: (error) => {
        console.error('Error adding payment method:', error);
      },
    });
  }

  cancelAddPaymentMethod(): void {
    this.displayModal = false;
    this.newPaymentMethodName = '';
    this.validationError = '';
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
