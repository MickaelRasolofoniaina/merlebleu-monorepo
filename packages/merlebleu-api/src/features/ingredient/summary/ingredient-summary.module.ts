import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientSchema } from '../ingredient.entity';
import { IngredientSummaryService } from './ingredient-summary.service';
import { IngredientSummaryController } from './ingredient-summary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientSchema])],
  providers: [IngredientSummaryService],
  controllers: [IngredientSummaryController],
})
export class IngredientSummaryModule {}
