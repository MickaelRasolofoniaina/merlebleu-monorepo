import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity, OrderItemEntity } from './order.entity';
import { PaymentMethodEntity } from '../payment/payment.entity';
import { PaymentService } from '../payment/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentMethodEntity,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, PaymentService],
})
export class OrderModule {}
