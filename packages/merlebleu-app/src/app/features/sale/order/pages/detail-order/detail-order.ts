import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Stepper, StepList, Step } from 'primeng/stepper';
import { Order } from '@merlebleu/shared';
import { OrderService } from '../../order.service';
import { ORDER_STATUSES } from '@shared/utils/order';

@Component({
  selector: 'detail-order',
  imports: [
    CommonModule,
    RouterLink,
    PanelModule,
    ButtonModule,
    Stepper,
    StepList,
    Step,
    ConfirmDialog,
  ],
  templateUrl: './detail-order.html',
  styleUrl: './detail-order.scss',
  providers: [ConfirmationService, DecimalPipe],
})
export class DetailOrder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly decimalPipe = inject(DecimalPipe);

  protected order?: Order;
  protected isLoading = false;
  protected isUpdatingStatus = false;

  protected readonly orderStatuses = ORDER_STATUSES;

  protected get activeStepIndex(): number {
    if (!this.order) return 0;
    return this.orderStatuses.findIndex((s) => s.value === this.order?.orderStatus) ?? 0;
  }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  protected formatPaymentMethod(): string {
    return this.order?.paymentMethod?.name ?? '-';
  }

  protected formatRemarks(value?: string | null): string {
    return value?.trim() ? value : '-';
  }

  protected onDeliver(): void {
    if (!this.order) return;

    const balanceAmountLabel =
      this.decimalPipe.transform(this.order.balanceAmount, '1.0-2') ??
      String(this.order.balanceAmount);

    this.confirmationService.confirm({
      message: `Voulez-vous livrer cette commande? Il reste <strong>${balanceAmountLabel} Ariary</strong> à payer.`,
      header: 'Livrer la commande',
      icon: 'pi pi-truck',
      acceptLabel: 'Livrer et payer le solde',
      rejectLabel: 'Retour',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        if (!this.order) return;
        this.isUpdatingStatus = true;
      },
    });
  }

  protected onCancel(): void {
    if (!this.order) return;

    this.confirmationService.confirm({
      message: 'Voulez-vous annuler cette commande?',
      header: 'Annuler la commande',
      icon: 'pi pi-trash',
      acceptLabel: 'Annuler',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        if (!this.order) return;
        this.isUpdatingStatus = true;
      },
    });
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
          this.order = order;
        },
      });
  }
}
