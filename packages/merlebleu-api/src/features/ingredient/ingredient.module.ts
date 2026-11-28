import { Module } from '@nestjs/common';
import { IngredientUnitModule } from './unit/ingredient-unit.module';
import { IngredientItemModule } from './ingredient-item.module';
import { StockEntryModule } from './stock-entry/stock-entry.module';
import { RecipeModule } from './recipe/recipe.module';
import { ProductionModule } from './production/production.module';
import { IngredientSummaryModule } from './summary/ingredient-summary.module';

@Module({
  imports: [
    IngredientUnitModule,
    IngredientItemModule,
    StockEntryModule,
    RecipeModule,
    ProductionModule,
    IngredientSummaryModule,
  ],
})
export class IngredientModule {}
