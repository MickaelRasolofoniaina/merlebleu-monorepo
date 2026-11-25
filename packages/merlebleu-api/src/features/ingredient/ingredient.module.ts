import { Module } from '@nestjs/common';
import { IngredientUnitModule } from './unit/ingredient-unit.module';
import { IngredientItemModule } from './ingredient-item.module';
import { IngredientPurchaseModule } from './purchase/ingredient-purchase.module';

@Module({
  imports: [
    IngredientUnitModule,
    IngredientItemModule,
    IngredientPurchaseModule,
  ],
})
export class IngredientModule {}
