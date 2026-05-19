import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientPurchaseSchema } from './ingredient-purchase.entity';
import { IngredientSchema } from '../ingredient.entity';
import { IngredientPurchaseService } from './ingredient-purchase.service';
import { IngredientPurchaseController } from './ingredient-purchase.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientPurchaseSchema, IngredientSchema])],
  providers: [IngredientPurchaseService],
  controllers: [IngredientPurchaseController],
})
export class IngredientPurchaseModule {}
