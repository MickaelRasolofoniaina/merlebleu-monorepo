import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { finalize, EMPTY, catchError } from 'rxjs';
import { Wallet, WalletSummary } from '@merlebleu/shared';
import { CurrentUserService } from '@shared/services/current-user.service';
import { formatUnitPrice } from '@shared/utils/number';
import { formatDay, isClosingDue, lastDayOfPreviousMonth, previousMonthLabel } from '../treasury.model';
import { TreasuryApiService } from '../treasury-api.service';
import { CashCountDialogComponent } from './components/cash-count-dialog/cash-count-dialog';
import { ClosingDialogComponent } from './components/closing-dialog/closing-dialog';
import { TransferDialogComponent } from './components/transfer-dialog/transfer-dialog';
import { WalletFormDialogComponent } from './components/wallet-form-dialog/wallet-form-dialog';

@Component({
  selector: 'mb-wallet-list',
  templateUrl: './wallet-list.html',
  imports: [
    RouterLink,
    ButtonModule,
    MessageModule,
    SkeletonModule,
    TagModule,
    CashCountDialogComponent,
    ClosingDialogComponent,
    TransferDialogComponent,
    WalletFormDialogComponent,
  ],
})
export class WalletListComponent {
  private readonly api = inject(TreasuryApiService);
  protected readonly isAdmin = inject(CurrentUserService).isAdmin;

  protected readonly formatAmount = formatUnitPrice;
  protected readonly formatDay = formatDay;

  protected readonly summary = signal<WalletSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly activeWallets = computed(() => this.summary()?.wallets.filter((w) => !w.archived) ?? []);
  protected readonly archivedWallets = computed(() => this.summary()?.wallets.filter((w) => w.archived) ?? []);
  protected readonly negativeWallets = computed(() => this.activeWallets().filter((w) => w.balance < 0));

  /** The previous month still has to be closed: only worth a reminder once there are wallets to close. */
  protected readonly closingDue = computed(() => {
    const data = this.summary();
    return data !== null && this.activeWallets().length > 0 && isClosingDue(data.lastClosingDate, new Date());
  });
  protected readonly reminderMonth = previousMonthLabel(new Date());

  protected showWalletDialog = false;
  protected showTransferDialog = false;
  protected showCashCountDialog = false;
  protected showClosingDialog = false;
  /** Closing date proposed by the dialog, today when null. */
  protected closingDate: string | null = null;
  protected selected: Wallet | null = null;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .getWallets()
      .pipe(
        // the error itself is shown by httpErrorInterceptor, the page only needs to show its error state
        catchError(() => {
          this.failed.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
      });
  }

  protected openCreate(): void {
    this.selected = null;
    this.showWalletDialog = true;
  }

  protected openEdit(wallet: Wallet): void {
    this.selected = wallet;
    this.showWalletDialog = true;
  }

  /** From the reminder, the previous month is proposed; from the header, today. */
  protected openClosing(forPreviousMonth: boolean): void {
    this.closingDate = forPreviousMonth ? lastDayOfPreviousMonth(new Date()) : null;
    this.showClosingDialog = true;
  }

  protected openTransfer(wallet: Wallet | null): void {
    this.selected = wallet;
    this.showTransferDialog = true;
  }

  protected openCashCount(wallet: Wallet): void {
    this.selected = wallet;
    this.showCashCountDialog = true;
  }

  protected restore(wallet: Wallet): void {
    this.api
      .updateWallet(wallet.id, {
        name: wallet.name,
        color: wallet.color,
        openingBalance: wallet.openingBalance,
        openingDate: wallet.openingDate,
        archived: false,
      })
      .subscribe({ next: () => this.load() });
  }
}
