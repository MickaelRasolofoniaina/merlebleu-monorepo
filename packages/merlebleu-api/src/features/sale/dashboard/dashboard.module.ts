import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseSchema } from '../../expense/expense.entity';
import { OrderItemSchema, OrderSchema } from '../order/order.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderSchema, OrderItemSchema, ExpenseSchema])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
