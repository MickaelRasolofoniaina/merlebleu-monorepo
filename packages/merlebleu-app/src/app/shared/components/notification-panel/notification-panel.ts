import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { NotificationDto, NotificationType } from '@merlebleu/shared';
import { NotificationService } from '../../services/notification.service';
import { formatNotificationDate } from '../../utils/date';
import { getNotificationTypeMeta } from '../../utils/notification-type';

@Component({
  selector: 'app-notification-panel',
  imports: [RouterLink, TagModule],
  templateUrl: './notification-panel.html',
})
export class NotificationPanelComponent {
  protected readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly formatNotificationDate = formatNotificationDate;
  protected readonly getNotificationTypeMeta = getNotificationTypeMeta;

  @Output() readonly notificationOpened = new EventEmitter<void>();

  protected onNotificationClick(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    this.notificationOpened.emit();

    if (notification.type === NotificationType.ORDER_DELETED) {
      return;
    }

    void this.router.navigate(['/sale/order/list'], {
      queryParams: { orderId: notification.orderId },
    });
  }
}
