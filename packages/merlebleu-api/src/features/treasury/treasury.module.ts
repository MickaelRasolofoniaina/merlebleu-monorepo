import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSchema } from '../sale/order/order.entity';
import { PaymentMethodSchema } from '../sale/payment/payment.entity';
import { TreasuryController } from './treasury.controller';
import {
  CashClosingLineSchema,
  CashClosingSchema,
  CashCountSchema,
  OrderRefundSchema,
  WalletTransferSchema,
} from './treasury.entity';
import { PeriodLockModule } from './period-lock/period-lock.module';
import { TreasuryService } from './treasury.service';

// Treasury: wallet balances, movements and receipts computed from orders and expenses.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentMethodSchema,
      OrderSchema,
      WalletTransferSchema,
      OrderRefundSchema,
      CashCountSchema,
      CashClosingSchema,
      CashClosingLineSchema,
    ]),
    PeriodLockModule,
  ],
  controllers: [TreasuryController],
  providers: [TreasuryService],
})
export class TreasuryModule {}
