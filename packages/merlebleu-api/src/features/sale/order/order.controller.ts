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
import {
  CreateOrderDto,
  DeliverOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
} from './order.dto';
import { OrderStatus } from '@merlebleu/shared';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user.decorator';
import { parsePositiveInt } from '@shared/pagination/pagination.utils';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  addOrder(
    @Body() body: CreateOrderDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.orderService.addOrder(body, currentUser.name);
  }

  @Get()
  listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderDate') orderDate?: string,
    @Query('deliveryDate') deliveryDate?: string,
    @Query('deliveryDateFrom') deliveryDateFrom?: string,
    @Query('deliveryDateTo') deliveryDateTo?: string,
    @Query('customerName') customerName?: string,
    @Query('status') status?: OrderStatus,
    @Query('excludeDelivered') excludeDelivered?: string,
    @Query('shopId') shopId?: string,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrders(pageNumber, limitNumber, {
      orderDate,
      deliveryDate,
      deliveryDateFrom,
      deliveryDateTo,
      customerName,
      status,
      excludeDelivered: excludeDelivered === 'true',
      shopId,
    });
  }

  @Get('to-prepare')
  listOrdersToPrepare(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('shopId') shopId?: string,
    @Query('status') status?: OrderStatus,
    @Query('orderDate') orderDate?: string,
    @Query('deliveryDate') deliveryDate?: string,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrdersToPrepare(
      pageNumber,
      limitNumber,
      customerName,
      shopId,
      status,
      orderDate,
      deliveryDate,
    );
  }

  @Get('late')
  listOrdersLate(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('shopId') shopId?: string,
    @Query('status') status?: OrderStatus,
    @Query('orderDate') orderDate?: string,
    @Query('deliveryDate') deliveryDate?: string,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrdersLate(
      pageNumber,
      limitNumber,
      customerName,
      shopId,
      status,
      orderDate,
      deliveryDate,
    );
  }

  @Get('items/to-prepare')
  listOrderItemsToPrepare(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrderItemsToPrepare(pageNumber, limitNumber);
  }

  @Get('items/to-deliver')
  listOrderItemsToDeliver(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrderItemsToDeliver(pageNumber, limitNumber);
  }

  @Get('items/late')
  listOrderItemsLate(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrderItemsLate(pageNumber, limitNumber);
  }

  @Get('today/to-prepare')
  listOrdersTodayToPrepare(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('shopId') shopId?: string,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrdersTodayToPrepare(
      pageNumber,
      limitNumber,
      customerName,
      shopId,
    );
  }

  @Get('today/to-deliver')
  listOrdersTodayToDeliver(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('shopId') shopId?: string,
    @Query('status') status?: OrderStatus,
  ) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrdersTodayToDeliver(
      pageNumber,
      limitNumber,
      customerName,
      shopId,
      status,
    );
  }

  @Get('items/today/to-prepare')
  listOrderItemsTodayToPrepare(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrderItemsTodayToPrepare(pageNumber, limitNumber);
  }

  @Get('items/today/to-deliver')
  listOrderItemsTodayToDeliver(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 20);
    return this.orderService.listOrderItemsTodayToDeliver(pageNumber, limitNumber);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Put(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() body: UpdateOrderDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.orderService.updateOrder(id, body, currentUser.name);
  }

  @Put(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.orderService.updateOrderStatus(
      id,
      body.status,
      currentUser.name,
    );
  }

  @Put(':id/deliver')
  deliverOrder(@Param('id') id: string, @Body() body: DeliverOrderDto) {
    return this.orderService.deliverOrder(id, body.paymentMethodId);
  }

  @Delete(':id')
  deleteOrder(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.orderService.deleteOrder(id, currentUser.name);
  }
}
