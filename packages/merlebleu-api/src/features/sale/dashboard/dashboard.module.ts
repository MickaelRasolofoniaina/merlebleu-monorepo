import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemSchema, OrderSchema } from '../order/order.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderSchema, OrderItemSchema])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
