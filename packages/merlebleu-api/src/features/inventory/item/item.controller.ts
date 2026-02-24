import { Controller, Get, Post, Put, Delete, Param, Body, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto } from './item.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  async addItem(@Body() dto: CreateItemDto) {
    return this.itemService.addItem(dto);
  }

  @Put(':id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.updateItem(id, dto);
  }

  @Delete(':id')
  async deleteItem(@Param('id') id: string) {
    return this.itemService.deleteItem(id);
  }

  @Get()
  async findItems(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('labelContains') labelContains?: string,
  ) {
    return this.itemService.findItems(page, limit, labelContains ? { labelContains } : undefined);
  }
}
