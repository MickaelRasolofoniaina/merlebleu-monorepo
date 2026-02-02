import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment/payment.module';

@Module({
  imports: [OrderModule, PaymentModule]
})
export class SaleModule {}
