import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSchema, OrderItemSchema } from './order.entity';
import { PaymentMethodSchema } from '../payment/payment.entity';
import { PaymentService } from '../payment/payment.service';
import { ShopSchema } from '../../shop/shop.entity';
import { ShopService } from '../../shop/shop.service';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderSchema,
      OrderItemSchema,
      PaymentMethodSchema,
      ShopSchema,
    ]),
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, PaymentService, ShopService],
})
export class OrderModule {}
