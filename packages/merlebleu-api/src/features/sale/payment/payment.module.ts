import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodSchema } from './payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethodSchema])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
