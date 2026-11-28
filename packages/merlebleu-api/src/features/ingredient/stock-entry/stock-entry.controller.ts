import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { StockEntryService } from './stock-entry.service';
import { CreateStockEntriesDto, UpdateStockEntryDto } from './stock-entry.dto';

@Controller('stock-entry')
export class StockEntryController {
  constructor(private readonly stockEntryService: StockEntryService) {}

  @Get()
  @ApiQuery({ name: 'entryDate', required: false, type: String })
  @ApiQuery({ name: 'labelContains', required: false, type: String })
  findStockEntries(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('entryDate') entryDate?: string,
    @Query('labelContains') labelContains?: string,
  ) {
    return this.stockEntryService.findStockEntries(page, limit, {
      entryDate,
      labelContains,
    });
  }

  @Post()
  addStockEntries(@Body() dto: CreateStockEntriesDto) {
    return this.stockEntryService.addStockEntries(dto);
  }

  @Put(':id')
  updateStockEntry(@Param('id') id: string, @Body() dto: UpdateStockEntryDto) {
    return this.stockEntryService.updateStockEntry(id, dto);
  }

  @Delete(':id')
  deleteStockEntry(@Param('id') id: string) {
    return this.stockEntryService.deleteStockEntry(id);
  }
}
