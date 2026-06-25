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
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto } from './item.dto';
import { ItemType } from '@merlebleu/shared';

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

  @ApiQuery({
    name: 'labelContains',
    required: false,
    type: String,
    description: 'Filter items by label substring',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ItemType,
    description: 'Filter items by type',
  })
  @Get()
  async findItems(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('labelContains') labelContains?: string,
    @Query('type', new ParseEnumPipe(ItemType, { optional: true }))
    type?: ItemType,
  ) {
    return this.itemService.findItems(page, limit, {
      ...(labelContains ? { labelContains } : {}),
      ...(type ? { type } : {}),
    });
  }

  @Get('type/:type')
  async findItemsByType(
    @Param('type', new ParseEnumPipe(ItemType)) type: ItemType,
  ) {
    return this.itemService.findItemsByType(type);
  }
}
