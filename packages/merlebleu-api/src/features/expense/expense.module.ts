import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientSchema } from '../ingredient/ingredient.entity';
import { PaymentMethodSchema } from '../sale/payment/payment.entity';
import { ExpenseCategoryController } from './category/expense-category.controller';
import { ExpenseCategorySchema } from './category/expense-category.entity';
import { ExpenseCategoryService } from './category/expense-category.service';
import { ExpenseController } from './expense.controller';
import { ExpenseSchema } from './expense.entity';
import { ExpenseService } from './expense.service';
import { PeriodLockModule } from '../treasury/period-lock/period-lock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseSchema,
      ExpenseCategorySchema,
      IngredientSchema,
      PaymentMethodSchema,
    ]),
    PeriodLockModule,
  ],
  controllers: [ExpenseController, ExpenseCategoryController],
  providers: [ExpenseService, ExpenseCategoryService],
})
export class ExpenseModule {}
