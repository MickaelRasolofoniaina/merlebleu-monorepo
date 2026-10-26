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
import { OrderStatus, Shape } from '@merlebleu/shared';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user.decorator';

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
    @Query('shopId') shopId?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrders(pageNumber, limitNumber, {
      orderDate,
      deliveryDate,
      deliveryDateFrom,
      deliveryDateTo,
      customerName,
      status,
      shopId,
    });
  }

  @Get('to-deliver')
  listOrdersToDeliver(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('shopId') shopId?: string,
    @Query('status') status?: OrderStatus,
    @Query('orderDate') orderDate?: string,
    @Query('deliveryDate') deliveryDate?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrdersToDeliver(
      pageNumber,
      limitNumber,
      customerName,
      shopId,
      status,
      orderDate,
      deliveryDate,
    );
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
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
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
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
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

  @Get('items')
  listOrderItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('deliveryDate') deliveryDate?: string,
    @Query('type') type?: string,
    @Query('shape') shape?: Shape,
    @Query('text') text?: string,
    @Query('decoration') decoration?: string,
    @Query('size') size?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrderItems(pageNumber, limitNumber, {
      customerName,
      deliveryDate,
      type,
      shape,
      text,
      decoration,
      size: size ? Number.parseInt(size, 10) : undefined,
    });
  }

  @Get('items/to-prepare')
  listOrderItemsToPrepare(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('type') type?: string,
    @Query('shape') shape?: Shape,
    @Query('text') text?: string,
    @Query('decoration') decoration?: string,
    @Query('size') size?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrderItemsToPrepare(pageNumber, limitNumber, {
      customerName,
      type,
      shape,
      text,
      decoration,
      size: size ? Number.parseInt(size, 10) : undefined,
    });
  }

  @Get('items/to-deliver')
  listOrderItemsToDeliver(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('type') type?: string,
    @Query('shape') shape?: Shape,
    @Query('text') text?: string,
    @Query('decoration') decoration?: string,
    @Query('size') size?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrderItemsToDeliver(pageNumber, limitNumber, {
      customerName,
      type,
      shape,
      text,
      decoration,
      size: size ? Number.parseInt(size, 10) : undefined,
    });
  }

  @Get('items/late')
  listOrderItemsLate(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Query('type') type?: string,
    @Query('shape') shape?: Shape,
    @Query('text') text?: string,
    @Query('decoration') decoration?: string,
    @Query('size') size?: string,
  ) {
    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    const limitNumber = limit ? Number.parseInt(limit, 10) : 20;
    return this.orderService.listOrderItemsLate(pageNumber, limitNumber, {
      customerName,
      type,
      shape,
      text,
      decoration,
      size: size ? Number.parseInt(size, 10) : undefined,
    });
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
