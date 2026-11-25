import {
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { parsePositiveInt } from '@shared/pagination/pagination.utils';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Sse('stream')
  stream(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Observable<MessageEvent> {
    return this.notificationService.asObservable().pipe(
      filter((notification) =>
        notification.targetRoles.includes(currentUser.role),
      ),
      map((notification) => ({ data: notification })),
    );
  }

  @Get('recent')
  getRecent(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = parsePositiveInt(limit, 5, 50);
    return this.notificationService.findRecent(
      currentUser.sub,
      currentUser.role,
      limitNumber,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.notificationService.countUnread(
      currentUser.sub,
      currentUser.role,
    );
  }

  @Get()
  listNotifications(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.notificationService.findPaginated(
      currentUser.sub,
      currentUser.role,
      pageNumber,
      limitNumber,
    );
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(
      currentUser.sub,
      currentUser.role,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.notificationService.markAsRead(
      id,
      currentUser.sub,
      currentUser.role,
    );
  }
}
