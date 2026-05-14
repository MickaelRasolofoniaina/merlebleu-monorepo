import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientCategorySchema } from './ingredient-category.entity';
import { IngredientCategoryService } from './ingredient-category.service';
import { IngredientCategoryController } from './ingredient-category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientCategorySchema])],
  providers: [IngredientCategoryService],
  controllers: [IngredientCategoryController],
})
export class IngredientCategoryModule {}
