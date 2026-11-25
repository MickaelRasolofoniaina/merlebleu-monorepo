import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './expense-category.dto';

@Controller('expense-category')
export class ExpenseCategoryController {
  constructor(private readonly categoryService: ExpenseCategoryService) {}

  @Get()
  getAll() {
    return this.categoryService.getAll();
  }

  @Post()
  add(@Body() dto: CreateExpenseCategoryDto) {
    return this.categoryService.add(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
