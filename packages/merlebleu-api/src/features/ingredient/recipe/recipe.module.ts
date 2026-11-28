import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeLineSchema, RecipeSchema } from './recipe.entity';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeSchema, RecipeLineSchema])],
  providers: [RecipeService],
  controllers: [RecipeController],
})
export class RecipeModule {}
