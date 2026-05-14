import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { IngredientCategoryService } from './ingredient-category.service';
import { CreateIngredientCategoryDto, UpdateIngredientCategoryDto } from './ingredient-category.dto';

@Controller('ingredient-category')
export class IngredientCategoryController {
  constructor(private readonly categoryService: IngredientCategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Post()
  add(@Body() dto: CreateIngredientCategoryDto) {
    return this.categoryService.add(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
