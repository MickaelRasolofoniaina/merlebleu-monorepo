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
import { IngredientPurchaseService } from './ingredient-purchase.service';
import {
  CreateIngredientPurchaseDto,
  UpdateIngredientPurchaseDto,
} from './ingredient-purchase.dto';

@Controller('ingredient-purchase')
export class IngredientPurchaseController {
  constructor(private readonly purchaseService: IngredientPurchaseService) {}

  @Get()
  @ApiQuery({ name: 'purchaseDate', required: false, type: String })
  @ApiQuery({ name: 'labelContains', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  findPurchases(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('purchaseDate') purchaseDate?: string,
    @Query('labelContains') labelContains?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.purchaseService.findPurchases(page, limit, {
      purchaseDate,
      labelContains,
      categoryId,
    });
  }

  @Post()
  addPurchase(@Body() dto: CreateIngredientPurchaseDto) {
    return this.purchaseService.addPurchase(dto);
  }

  @Put(':id')
  updatePurchase(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientPurchaseDto,
  ) {
    return this.purchaseService.updatePurchase(id, dto);
  }

  @Delete(':id')
  deletePurchase(@Param('id') id: string) {
    return this.purchaseService.deletePurchase(id);
  }
}
