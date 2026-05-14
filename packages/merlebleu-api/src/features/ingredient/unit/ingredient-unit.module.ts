import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientUnitSchema } from './ingredient-unit.entity';
import { IngredientUnitService } from './ingredient-unit.service';
import { IngredientUnitController } from './ingredient-unit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientUnitSchema])],
  providers: [IngredientUnitService],
  controllers: [IngredientUnitController],
})
export class IngredientUnitModule {}
