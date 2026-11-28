import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';

@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  @ApiQuery({ name: 'labelContains', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findRecipes(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('labelContains') labelContains?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.recipeService.findRecipes(page, limit, {
      labelContains,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Post()
  addRecipe(@Body() dto: CreateRecipeDto) {
    return this.recipeService.addRecipe(dto);
  }

  @Put(':id')
  updateRecipe(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipeService.updateRecipe(id, dto);
  }

  @Patch(':id/archive')
  archiveRecipe(@Param('id') id: string) {
    return this.recipeService.setActive(id, false);
  }

  @Patch(':id/restore')
  restoreRecipe(@Param('id') id: string) {
    return this.recipeService.setActive(id, true);
  }

  @Post(':id/duplicate')
  duplicateRecipe(@Param('id') id: string) {
    return this.recipeService.duplicateRecipe(id);
  }
}
