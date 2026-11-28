import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientSchema } from '../ingredient.entity';
import { RecipeLineSchema, RecipeSchema } from '../recipe/recipe.entity';
import {
  ProductionConsumptionSchema,
  ProductionSchema,
} from './production.entity';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionSchema,
      ProductionConsumptionSchema,
      RecipeSchema,
      RecipeLineSchema,
      IngredientSchema,
    ]),
  ],
  providers: [ProductionService],
  controllers: [ProductionController],
})
export class ProductionModule {}
