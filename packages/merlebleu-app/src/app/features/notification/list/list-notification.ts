import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationDto, NotificationType } from '@merlebleu/shared';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { finalize } from 'rxjs';
import { NotificationService } from '@shared/services/notification.service';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import {
  formatNotificationDayLabel,
  formatTime,
} from '@shared/utils/date';
import {
  getNotificationTypeMeta,
  NotificationTypeMeta,
} from '@shared/utils/notification-type';

const NOTIFICATIONS_PAGE_SIZE = 10;

interface NotificationGroup {
  label: string;
  items: NotificationDto[];
}

@Component({
  selector: 'app-list-notification',
  templateUrl: './list-notification.html',
  imports: [PaginatorModule, ButtonModule, ConfirmDialog],
  providers: [ConfirmationService],
})
export class ListNotificationComponent implements OnInit {
  protected readonly getNotificationTypeMeta = getNotificationTypeMeta;

  protected readonly titleClasses: Record<
    NotificationTypeMeta['severity'],
    string
  > = {
    success: 'text-green-800 dark:text-green-400',
    warn: 'text-amber-800 dark:text-amber-400',
    danger: 'text-red-800 dark:text-red-400',
    info: 'text-blue-800 dark:text-blue-400',
  };

  notifications = signal<NotificationDto[]>([]);
  page = signal(1);
  rows = NOTIFICATIONS_PAGE_SIZE;
  first = signal(0);
  totalRecords = signal(0);
  isLoading = signal(false);

  protected readonly groups = computed<NotificationGroup[]>(() => {
    const groups: NotificationGroup[] = [];

    for (const notification of this.notifications()) {
      const label = formatNotificationDayLabel(notification.createdAt);
      const last = groups[groups.length - 1];

      if (last?.label === label) {
        last.items.push(notification);
      } else {
        groups.push({ label, items: [notification] });
      }
    }

    return groups;
  });

  protected readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.fetchNotifications();
  }

  protected formatTimeOf(notification: NotificationDto): string {
    return formatTime(new Date(notification.createdAt));
  }

  fetchNotifications(): void {
    this.isLoading.set(true);
    this.notificationService
      .loadPaginated(this.page(), this.rows)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ data, total }) => {
        this.notifications.set(data);
        this.totalRecords.set(total);
      });
  }

  onPageChange(event: PaginatorState): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.rows;

    this.page.set(getPageFromFirstRows(first, rows));
    this.rows = rows;
    this.first.set(first);
    this.fetchNotifications();
  }

  onNotificationRowClick(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    if (notification.type === NotificationType.ORDER_DELETED) {
      return;
    }

    void this.router.navigate(['/sale/order/list'], {
      queryParams: { orderId: notification.orderId },
    });
  }

  markAsRead(notification: NotificationDto): void {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.notifications.update((list) =>
        list.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
    });
  }

  confirmMarkAllAsRead(): void {
    this.confirmationService.confirm({
      message: 'Marquer toutes les notifications comme lues ?',
      header: 'Marquer tout comme lue',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonProps: { severity: 'contrast' },
      accept: () => this.markAllAsRead(),
    });
  }

  private markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update((list) =>
        list.map((item) => ({ ...item, isRead: true })),
      );
    });
  }
}
