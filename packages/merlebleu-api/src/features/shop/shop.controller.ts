import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto, UpdateShopDto } from './shop.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  findAll() {
    return this.shopService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shopService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shopService.delete(id);
  }
}
