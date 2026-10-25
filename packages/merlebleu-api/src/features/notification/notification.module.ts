import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import {
  NotificationSchema,
  NotificationReadSchema,
} from './notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSchema, NotificationReadSchema]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
