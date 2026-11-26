import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderSchema } from '../sale/order/order.entity';
import { PaymentMethodSchema } from '../sale/payment/payment.entity';
import { TreasuryController } from './treasury.controller';
import {
  CashCountSchema,
  OrderRefundSchema,
  WalletTransferSchema,
} from './treasury.entity';
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
    ]),
  ],
  controllers: [TreasuryController],
  providers: [TreasuryService],
})
export class TreasuryModule {}
