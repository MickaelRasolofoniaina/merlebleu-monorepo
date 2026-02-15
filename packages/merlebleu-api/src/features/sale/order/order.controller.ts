import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import { OrderStatus } from '@merlebleu/shared';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  addOrder(@Body() body: CreateOrderDto) {
    return this.orderService.addOrder(body);
  }

  @Get()
  listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderDate') orderDate?: string,
    @Query('deliveryDate') deliveryDate?: string,
    @Query('customerName') customerName?: string,
    @Query('status') status?: OrderStatus,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrders(pageNumber, limitNumber, {
      orderDate,
      deliveryDate,
      customerName,
      status,
    });
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Put(':id')
  updateOrder(@Param('id') id: string, @Body() body: UpdateOrderDto) {
    return this.orderService.updateOrder(id, body);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}
