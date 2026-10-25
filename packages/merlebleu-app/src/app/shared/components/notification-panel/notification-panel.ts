import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
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
  protected readonly formatNotificationDate = formatNotificationDate;
  protected readonly getNotificationTypeMeta = getNotificationTypeMeta;
}
