import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientSchema } from './ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import { RecipeLineSchema } from './recipe/recipe.entity';
import { ProductionConsumptionSchema } from './production/production.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IngredientSchema,
      RecipeLineSchema,
      ProductionConsumptionSchema,
    ]),
  ],
  providers: [IngredientService],
  controllers: [IngredientController],
})
export class IngredientItemModule {}
