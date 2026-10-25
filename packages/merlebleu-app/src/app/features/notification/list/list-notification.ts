import { Component, OnInit, inject, signal } from '@angular/core';
import { DEFAULT_PAGE_SIZE, NotificationDto } from '@merlebleu/shared';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { NotificationService } from '@shared/services/notification.service';
import { getPageFromFirstRows } from '@shared/utils/pagination';
import { formatNotificationDate } from '@shared/utils/date';
import { getNotificationTypeMeta } from '@shared/utils/notification-type';

@Component({
  selector: 'app-list-notification',
  templateUrl: './list-notification.html',
  imports: [TableModule, ButtonModule, TagModule, ConfirmDialog],
  providers: [ConfirmationService],
})
export class ListNotificationComponent implements OnInit {
  protected readonly getNotificationTypeMeta = getNotificationTypeMeta;
  protected readonly formatNotificationDate = formatNotificationDate;

  notifications = signal<NotificationDto[]>([]);
  page = signal(1);
  rows = DEFAULT_PAGE_SIZE;
  first = signal(0);
  totalRecords = signal(0);
  isLoading = signal(false);

  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    this.isLoading.set(true);
    this.notificationService
      .loadPaginated(this.page(), this.rows)
      .subscribe(({ data, total }) => {
        this.notifications.set(data);
        this.totalRecords.set(total);
        this.isLoading.set(false);
      });
  }

  onTablePage(event: TablePageEvent): void {
    this.page.set(getPageFromFirstRows(event.first, event.rows));
    this.rows = event.rows;
    this.first.set(event.first);
    this.fetchNotifications();
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
      rejectButtonStyleClass: 'p-button-danger',
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
