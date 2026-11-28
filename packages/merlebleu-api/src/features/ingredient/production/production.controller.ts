import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Query,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { SaveProductionDayDto } from './production.dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  @ApiQuery({ name: 'date', required: true, type: String })
  findByDate(@Query('date') date?: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException('La date doit être au format AAAA-MM-JJ');
    return this.productionService.findByDate(date);
  }

  @Put('day')
  saveDay(@Body() dto: SaveProductionDayDto) {
    return this.productionService.saveDay(dto);
  }
}
