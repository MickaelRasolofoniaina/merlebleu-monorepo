import { Module } from '@nestjs/common';
import { IngredientCategoryModule } from './category/ingredient-category.module';
import { IngredientUnitModule } from './unit/ingredient-unit.module';

@Module({
  imports: [IngredientCategoryModule, IngredientUnitModule],
})
export class IngredientModule {}
