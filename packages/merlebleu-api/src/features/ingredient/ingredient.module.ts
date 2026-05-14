import { Module } from '@nestjs/common';
import { IngredientCategoryModule } from './category/ingredient-category.module';
import { IngredientUnitModule } from './unit/ingredient-unit.module';
import { IngredientItemModule } from './ingredient-item.module';
import { IngredientPurchaseModule } from './purchase/ingredient-purchase.module';

@Module({
  imports: [
    IngredientCategoryModule,
    IngredientUnitModule,
    IngredientItemModule,
    IngredientPurchaseModule,
  ],
})
export class IngredientModule {}
