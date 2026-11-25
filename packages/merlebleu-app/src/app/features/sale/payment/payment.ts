import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_PAYMENT_METHOD_COLOR,
  PaymentMethod,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from '@merlebleu/shared';
import { PaymentMethodBadge } from '@shared/components/payment-method-badge/payment-method-badge';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment',
  imports: [
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    PaymentMethodBadge,
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class Payment implements OnInit {
  private readonly paymentService = inject(PaymentService);
  paymentMethods = signal<PaymentMethod[]>([]);
  isLoadingPayments = false;
  displayModal = false;
  displayEditModal = false;
  displayDeleteModal = false;
  newPaymentMethodName = '';
  newPaymentMethodColor = DEFAULT_PAYMENT_METHOD_COLOR;
  editPaymentMethodName = '';
  editPaymentMethodColor = DEFAULT_PAYMENT_METHOD_COLOR;
  editPaymentMethodId: string | null = null;
  deletePaymentMethodName = '';
  deletePaymentMethodId: string | null = null;
  validationError = '';
  editValidationError = '';
  deleteValidationError = '';

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.isLoadingPayments = true;
    this.paymentService.getAllPaymentMethods().subscribe({
      next: (data) => {
        this.paymentMethods.set(data);
        this.isLoadingPayments = false;
      },
      error: (error) => {
        this.isLoadingPayments = false;
        console.error('Error loading payment methods:', error);
      },
    });
  }

  addPaymentMethod(): void {
    this.newPaymentMethodName = '';
    this.newPaymentMethodColor = DEFAULT_PAYMENT_METHOD_COLOR;
    this.validationError = '';
    this.displayModal = true;
  }

  confirmAddPaymentMethod(): void {
    this.validationError = '';

    const validation = createPaymentMethodSchema.safeParse({
      name: this.newPaymentMethodName,
      color: this.newPaymentMethodColor,
    });

    if (!validation.success) {
      this.validationError = validation.error.issues.map((issue) => issue.message).join(', ');
      return;
    }

    this.paymentService.addPaymentMethod({ name: this.newPaymentMethodName, color: this.newPaymentMethodColor }).subscribe({
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
    this.editPaymentMethodId = payment.id ?? null;
    this.editPaymentMethodName = payment.name;
    this.editPaymentMethodColor = payment.color ?? DEFAULT_PAYMENT_METHOD_COLOR;
    this.editValidationError = '';
    this.displayEditModal = true;
  }

  confirmUpdatePaymentMethod(): void {
    this.editValidationError = '';

    const validation = updatePaymentMethodSchema.safeParse({
      name: this.editPaymentMethodName,
      color: this.editPaymentMethodColor,
    });

    if (!validation.success) {
      this.editValidationError = validation.error.issues.map((issue) => issue.message).join(', ');
      return;
    }

    if (!this.editPaymentMethodId) {
      this.editValidationError = 'Identifiant de méthode de paiement manquant';
      return;
    }

    this.paymentService
      .updatePaymentMethod(this.editPaymentMethodId, {
        name: this.editPaymentMethodName,
        color: this.editPaymentMethodColor,
      })
      .subscribe({
        next: () => {
          this.loadPaymentMethods();
          this.displayEditModal = false;
          this.editPaymentMethodName = '';
          this.editPaymentMethodId = null;
          this.editValidationError = '';
        },
        error: (error) => {
          console.error('Error updating payment method:', error);
        },
      });
  }

  cancelEditPaymentMethod(): void {
    this.displayEditModal = false;
    this.editPaymentMethodName = '';
    this.editPaymentMethodId = null;
    this.editValidationError = '';
  }

  deletePaymentMethod(id: string, name: string): void {
    this.deletePaymentMethodId = id;
    this.deletePaymentMethodName = name;
    this.deleteValidationError = '';
    this.displayDeleteModal = true;
  }

  confirmDeletePaymentMethod(): void {
    this.deleteValidationError = '';

    if (!this.deletePaymentMethodId) {
      this.deleteValidationError = 'Identifiant de méthode de paiement manquant';
      return;
    }

    this.paymentService.deletePaymentMethod(this.deletePaymentMethodId).subscribe({
      next: () => {
        this.loadPaymentMethods();
        this.displayDeleteModal = false;
        this.deletePaymentMethodName = '';
        this.deletePaymentMethodId = null;
        this.deleteValidationError = '';
      },
    });
  }

  cancelDeletePaymentMethod(): void {
    this.displayDeleteModal = false;
    this.deletePaymentMethodName = '';
    this.deletePaymentMethodId = null;
    this.deleteValidationError = '';
  }
}
