import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { EMPTY, catchError, finalize } from 'rxjs';
import { CashClosing } from '@merlebleu/shared';
import { CurrentUserService } from '@shared/services/current-user.service';
import { formatUnitPrice } from '@shared/utils/number';
import { formatDay } from '../treasury.model';
import { TreasuryApiService } from '../treasury-api.service';
import { ClosingDialogComponent } from '../wallet/components/closing-dialog/closing-dialog';

/** The closings of the cash, newest first. Only the latest one can be reopened. */
@Component({
  selector: 'mb-closing-list',
  templateUrl: './closing-list.html',
  imports: [DatePipe, ButtonModule, DialogModule, MessageModule, SkeletonModule, TagModule, ClosingDialogComponent],
})
export class ClosingListComponent {
  private readonly api = inject(TreasuryApiService);
  private readonly messageService = inject(MessageService);
  protected readonly isAdmin = inject(CurrentUserService).isAdmin;

  protected readonly formatAmount = formatUnitPrice;
  protected readonly formatDay = formatDay;

  protected readonly closings = signal<CashClosing[] | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected readonly lastClosing = computed(() => this.closings()?.find((closing) => closing.reopenable) ?? null);

  protected showClosingDialog = false;
  protected readonly confirmingReopen = signal(false);
  protected readonly reopening = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .listClosings()
      .pipe(
        // the error itself is shown by httpErrorInterceptor, the page only needs to show its error state
        catchError(() => {
          this.failed.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (closings) => {
          this.closings.set(closings);
          // the latest closing is open by default, it is the one the admin looks at
          this.expanded.set(new Set(closings.slice(0, 1).map((closing) => closing.id)));
        },
      });
  }

  protected toggle(closing: CashClosing): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(closing.id)) next.add(closing.id);
      return next;
    });
  }

  protected reopen(): void {
    this.reopening.set(true);
    this.api
      .reopenLastClosing()
      .pipe(finalize(() => this.reopening.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Clôture rouverte',
            detail: 'Les mouvements de la période sont de nouveau modifiables.',
          });
          this.confirmingReopen.set(false);
          this.load();
        },
      });
  }
}
