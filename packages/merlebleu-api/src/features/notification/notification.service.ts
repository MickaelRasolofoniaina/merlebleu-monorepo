import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, Subject } from 'rxjs';
import {
  Notification,
  NotificationDto,
  NotificationType,
  ResultPaged,
  UserRole,
} from '@merlebleu/shared';
import {
  NotificationEntity,
  NotificationReadEntity,
} from './notification.entity';
import { UserEntity } from '../identity/user/user.entity';
import { getPaginationParams } from '@shared/pagination/pagination.utils';

interface CreateNotificationInput {
  orderId: string;
  customerName: string;
  actorName: string;
  targetRoles: UserRole[];
}

@Injectable()
export class NotificationService {
  private readonly stream$ = new Subject<Notification>();

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationReadEntity)
    private notificationReadRepository: Repository<NotificationReadEntity>,
  ) {}

  async create(
    type: NotificationType,
    input: CreateNotificationInput,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      type,
      ...input,
    });

    const saved = await this.notificationRepository.save(notification);

    this.stream$.next(saved);

    return saved;
  }

  asObservable(): Observable<Notification> {
    return this.stream$.asObservable();
  }

  async findRecent(
    userId: string,
    role: UserRole,
    limit: number,
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationForRoleQuery(role)
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return this.toDtos(notifications, userId);
  }

  async findPaginated(
    userId: string,
    role: UserRole,
    page: number,
    limit: number,
  ): Promise<ResultPaged<NotificationDto>> {
    const pagination = getPaginationParams({ page, limit });

    const query = this.notificationForRoleQuery(role).orderBy(
      'notification.createdAt',
      'DESC',
    );

    const total = await query.getCount();

    const notifications = await query
      .take(pagination.limit)
      .skip(pagination.skip)
      .getMany();

    return {
      data: await this.toDtos(notifications, userId),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async countUnread(userId: string, role: UserRole): Promise<number> {
    const totalForRole = await this.notificationForRoleQuery(role).getCount();

    const readCountForRole = await this.notificationReadRepository
      .createQueryBuilder('read')
      .innerJoin('read.notification', 'notification')
      .innerJoin('read.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere(':role = ANY(notification.targetRoles)', { role })
      .getCount();

    return totalForRole - readCountForRole;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const existing = await this.notificationReadRepository.findOne({
      where: {
        notification: { id: notificationId },
        user: { id: userId },
      },
    });

    if (existing) {
      return;
    }

    await this.notificationReadRepository.save(
      this.notificationReadRepository.create({
        notification: { id: notificationId } as NotificationEntity,
        user: { id: userId } as UserEntity,
      }),
    );
  }

  async markAllAsRead(userId: string, role: UserRole): Promise<void> {
    const notifications = await this.notificationForRoleQuery(role).getMany();
    const readIds = await this.getReadNotificationIds(
      userId,
      notifications.map((notification) => notification.id),
    );
    const unread = notifications.filter(
      (notification) => !readIds.has(notification.id),
    );

    if (unread.length === 0) {
      return;
    }

    await this.notificationReadRepository.save(
      unread.map((notification) =>
        this.notificationReadRepository.create({
          notification: { id: notification.id } as NotificationEntity,
          user: { id: userId } as UserEntity,
        }),
      ),
    );
  }

  private notificationForRoleQuery(role: UserRole) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .where(':role = ANY(notification.targetRoles)', { role });
  }

  private async getReadNotificationIds(
    userId: string,
    notificationIds: string[],
  ): Promise<Set<string>> {
    if (notificationIds.length === 0) {
      return new Set();
    }

    const reads = await this.notificationReadRepository
      .createQueryBuilder('read')
      .innerJoin('read.notification', 'notification')
      .innerJoin('read.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('notification.id IN (:...notificationIds)', {
        notificationIds,
      })
      .select('notification.id', 'notificationId')
      .getRawMany<{ notificationId: string }>();

    return new Set(reads.map((read) => read.notificationId));
  }

  private async toDtos(
    notifications: NotificationEntity[],
    userId: string,
  ): Promise<NotificationDto[]> {
    const readIds = await this.getReadNotificationIds(
      userId,
      notifications.map((notification) => notification.id),
    );

    return notifications.map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id),
    }));
  }
}
