import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientSchema } from './ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientSchema])],
  providers: [IngredientService],
  controllers: [IngredientController],
})
export class IngredientItemModule {}
