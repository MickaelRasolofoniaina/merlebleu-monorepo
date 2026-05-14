import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { IngredientUnitService } from './ingredient-unit.service';
import {
  CreateIngredientUnitDto,
  UpdateIngredientUnitDto,
} from './ingredient-unit.dto';

@Controller('ingredient-unit')
export class IngredientUnitController {
  constructor(private readonly unitService: IngredientUnitService) {}

  @Get()
  findAll() {
    return this.unitService.findAll();
  }

  @Post()
  add(@Body() dto: CreateIngredientUnitDto) {
    return this.unitService.add(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientUnitDto) {
    return this.unitService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.unitService.delete(id);
  }
}
