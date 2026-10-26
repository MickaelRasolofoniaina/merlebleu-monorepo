import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [OrderModule, PaymentModule, DashboardModule],
})
export class SaleModule {}
