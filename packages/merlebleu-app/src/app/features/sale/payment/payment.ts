import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import {
  PaymentMethod,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from '@merlebleu/shared';
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
  isLoadingPayments = false;
  displayModal = false;
  displayEditModal = false;
  displayDeleteModal = false;
  newPaymentMethodName = '';
  editPaymentMethodName = '';
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
        this.paymentMethods = data;
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
    this.validationError = '';
    this.displayModal = true;
  }

  confirmAddPaymentMethod(): void {
    this.validationError = '';

    const validation = createPaymentMethodSchema.safeParse({
      name: this.newPaymentMethodName,
    });

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

  editPaymentMethod(id: string, editPaymentMethodName: string): void {
    this.editPaymentMethodId = id;
    this.editPaymentMethodName = editPaymentMethodName;
    this.editValidationError = '';
    this.displayEditModal = true;
  }

  confirmUpdatePaymentMethod(): void {
    this.editValidationError = '';

    const validation = updatePaymentMethodSchema.safeParse({
      name: this.editPaymentMethodName,
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
      .updatePaymentMethod(this.editPaymentMethodId, { name: this.editPaymentMethodName })
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
      error: (error) => {
        console.error('Error deleting payment method:', error);
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
