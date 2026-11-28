import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { IngredientSummaryService } from './ingredient-summary.service';

@Controller('ingredient-summary')
export class IngredientSummaryController {
  constructor(private readonly summaryService: IngredientSummaryService) {}

  @Get()
  @ApiQuery({ name: 'month', required: true, type: String, example: '2026-10' })
  getMonthSummary(@Query('month') month: string) {
    return this.summaryService.getMonthSummary(month);
  }
}
