import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSchema, OrderItemSchema } from './order.entity';
import { PaymentMethodSchema } from '../payment/payment.entity';
import { PaymentService } from '../payment/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderSchema,
      OrderItemSchema,
      PaymentMethodSchema,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, PaymentService],
})
export class OrderModule {}
