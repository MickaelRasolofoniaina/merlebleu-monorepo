import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { IngredientService } from './ingredient.service';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  UpdateIngredientStockDto,
} from './ingredient.dto';

@Controller('ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @ApiQuery({ name: 'labelContains', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  findIngredients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('labelContains') labelContains?: string,
    @Query('categoryId') categoryId?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.ingredientService.findIngredients(page, limit, {
      labelContains,
      categoryId,
      unitId,
    });
  }

  @Post()
  addIngredient(@Body() dto: CreateIngredientDto) {
    return this.ingredientService.addIngredient(dto);
  }

  @Put(':id')
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredientService.updateIngredient(id, dto);
  }

  @Delete(':id')
  deleteIngredient(@Param('id') id: string) {
    return this.ingredientService.deleteIngredient(id);
  }

  @Patch(':id/stock')
  updateIngredientStock(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientStockDto,
  ) {
    return this.ingredientService.updateIngredientStock(id, dto);
  }
}
