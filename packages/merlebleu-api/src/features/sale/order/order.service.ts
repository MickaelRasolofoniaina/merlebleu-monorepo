import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity, OrderItemSchema } from './order.entity';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import {
  OrderItemDto,
  OrderItemRowDto,
  OrderStatus,
  ResultPaged,
  Shape,
} from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { formatDate } from '@shared/date/date.utils';
import { PaymentService } from '../payment/payment.service';
import { ShopService } from '../../shop/shop.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemSchema)
    private orderItemRepository: Repository<OrderItemEntity>,
    private paymentService: PaymentService,
    private shopService: ShopService,
  ) {}

  async addOrder(order: CreateOrderDto): Promise<OrderEntity> {
    const paymentMethod = await this.paymentService.getPaymentMethod(
      order.paymentMethodId,
    );
    const shop = await this.shopService.findOne(order.shopId);

    const { orderData, orderItems } = this.splitOrderInput(order);
    const orderEntity = {
      ...orderData,
      paymentMethod,
      shop,
    } as OrderEntity;

    orderEntity.orderItems = this.buildOrderItems(orderItems, orderEntity);

    const savedOrder = await this.orderRepository.save(orderEntity);

    return this.sanitizeOrder(savedOrder);
  }

  async listOrders(
    page = 1,
    limit = 20,
    filters?: {
      orderDate?: string;
      deliveryDate?: string;
      deliveryDateFrom?: string;
      deliveryDateTo?: string;
      customerName?: string;
      status?: OrderStatus;
      statuses?: OrderStatus[];
      shopId?: string;
    },
  ): Promise<ResultPaged<OrderEntity>> {
    const pagination = getPaginationParams({ page, limit });

    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.orderItems', 'orderItems')
      .leftJoinAndSelect('orders.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('orders.shop', 'shop')
      .orderBy('orders.deliveryDate', 'ASC')
      .addOrderBy('orders.deliveryStartTime', 'ASC')
      .addOrderBy('orders.id', 'ASC');

    if (filters?.orderDate) {
      query.andWhere('orders.orderDate = :orderDate', {
        orderDate: filters.orderDate,
      });
    }

    if (filters?.deliveryDate) {
      query.andWhere('orders.deliveryDate = :deliveryDate', {
        deliveryDate: filters.deliveryDate,
      });
    }

    if (filters?.deliveryDateFrom) {
      query.andWhere('orders.deliveryDate >= :deliveryDateFrom', {
        deliveryDateFrom: filters.deliveryDateFrom,
      });
    }

    if (filters?.deliveryDateTo) {
      query.andWhere('orders.deliveryDate < :deliveryDateTo', {
        deliveryDateTo: filters.deliveryDateTo,
      });
    }

    if (filters?.customerName) {
      query.andWhere('orders.customerName ILIKE :customerName', {
        customerName: `%${filters.customerName}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('orders.orderStatus = :status', {
        status: filters.status,
      });
    } else if (filters?.statuses?.length) {
      query.andWhere('orders.orderStatus IN (:...statuses)', {
        statuses: filters.statuses,
      });
    }

    if (filters?.shopId) {
      query.andWhere('shop.id = :shopId', { shopId: filters.shopId });
    }

    query.take(pagination.limit).skip(pagination.skip);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((order) => this.sanitizeOrder(order)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async listOrdersToDeliver(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Promise<ResultPaged<OrderEntity>> {
    const today = this.getToday();

    return this.listOrders(page, limit, {
      deliveryDateFrom: today,
      customerName,
      shopId,
      status,
      statuses: status ? undefined : [OrderStatus.TODELIVER],
      orderDate,
      deliveryDate,
    });
  }

  async listOrdersToPrepare(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Promise<ResultPaged<OrderEntity>> {
    const today = this.getToday();

    return this.listOrders(page, limit, {
      deliveryDateFrom: today,
      customerName,
      shopId,
      status,
      statuses: status
        ? undefined
        : [OrderStatus.TODO, OrderStatus.INPROGRESS],
      orderDate,
      deliveryDate,
    });
  }

  async listOrderItems(
    page = 1,
    limit = 20,
    filters?: {
      customerName?: string;
      deliveryDate?: string;
      deliveryDateFrom?: string;
      deliveryDateTo?: string;
      type?: string;
      shape?: Shape;
      text?: string;
      decoration?: string;
      size?: number;
      statuses?: OrderStatus[];
    },
  ): Promise<ResultPaged<OrderItemRowDto>> {
    const pagination = getPaginationParams({ page, limit });

    const query = this.orderItemRepository
      .createQueryBuilder('orderItems')
      .innerJoinAndSelect('orderItems.order', 'orders')
      .orderBy('orders.deliveryDate', 'ASC')
      .addOrderBy('orders.deliveryStartTime', 'ASC')
      .addOrderBy('orders.id', 'ASC');

    if (filters?.customerName) {
      query.andWhere('orders.customerName ILIKE :customerName', {
        customerName: `%${filters.customerName}%`,
      });
    }

    if (filters?.deliveryDate) {
      query.andWhere('orders.deliveryDate = :deliveryDate', {
        deliveryDate: filters.deliveryDate,
      });
    }

    if (filters?.deliveryDateFrom) {
      query.andWhere('orders.deliveryDate >= :deliveryDateFrom', {
        deliveryDateFrom: filters.deliveryDateFrom,
      });
    }

    if (filters?.deliveryDateTo) {
      query.andWhere('orders.deliveryDate < :deliveryDateTo', {
        deliveryDateTo: filters.deliveryDateTo,
      });
    }

    if (filters?.type) {
      query.andWhere('orderItems.type ILIKE :type', {
        type: `%${filters.type}%`,
      });
    }

    if (filters?.shape) {
      query.andWhere('orderItems.shape = :shape', { shape: filters.shape });
    }

    if (filters?.text) {
      query.andWhere('orderItems.text ILIKE :text', {
        text: `%${filters.text}%`,
      });
    }

    if (filters?.decoration) {
      query.andWhere('orderItems.decoration ILIKE :decoration', {
        decoration: `%${filters.decoration}%`,
      });
    }

    if (filters?.size !== undefined) {
      query.andWhere('orderItems.size = :size', { size: filters.size });
    }

    if (filters?.statuses?.length) {
      query.andWhere('orders.orderStatus IN (:...statuses)', {
        statuses: filters.statuses,
      });
    }

    query.take(pagination.limit).skip(pagination.skip);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((item) => this.toOrderItemRowDto(item)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async listOrderItemsToDeliver(
    page = 1,
    limit = 20,
    filters?: {
      customerName?: string;
      type?: string;
      shape?: Shape;
      text?: string;
      decoration?: string;
      size?: number;
    },
  ): Promise<ResultPaged<OrderItemRowDto>> {
    const today = this.getToday();

    return this.listOrderItems(page, limit, {
      ...filters,
      deliveryDateFrom: today,
      statuses: [OrderStatus.TODELIVER],
    });
  }

  async listOrderItemsToPrepare(
    page = 1,
    limit = 20,
    filters?: {
      customerName?: string;
      type?: string;
      shape?: Shape;
      text?: string;
      decoration?: string;
      size?: number;
    },
  ): Promise<ResultPaged<OrderItemRowDto>> {
    const today = this.getToday();

    return this.listOrderItems(page, limit, {
      ...filters,
      deliveryDateFrom: today,
      statuses: [OrderStatus.TODO, OrderStatus.INPROGRESS],
    });
  }

  async getOrderById(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: true, paymentMethod: true, shop: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return this.sanitizeOrder(order);
  }

  async updateOrder(id: string, order: UpdateOrderDto): Promise<OrderEntity> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: true, paymentMethod: true, shop: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const paymentMethod = await this.paymentService.getPaymentMethod(
      order.paymentMethodId,
    );
    const shop = await this.shopService.findOne(order.shopId);

    const { orderData, orderItems } = this.splitOrderInput(order);

    Object.assign(existingOrder, {
      ...orderData,
      paymentMethod,
      shop,
    });

    existingOrder.orderItems = this.buildOrderItems(orderItems, existingOrder);

    const savedOrder = await this.orderRepository.save(existingOrder);

    return this.sanitizeOrder(savedOrder);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: false, paymentMethod: false },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    existingOrder.orderStatus = status;

    await this.orderRepository.save(existingOrder);

    return true;
  }

  async deleteOrder(id: string): Promise<void> {
    const deleteResult = await this.orderRepository.delete(id);

    if (!deleteResult.affected) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
  }

  private buildOrderItems(
    items: OrderItemDto[],
    order: OrderEntity,
  ): OrderItemEntity[] {
    return items.map(
      (item) =>
        ({
          type: item.type,
          size: item.size,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
          shape: item.shape,
          text: item.text,
          decoration: item.decoration,
          remarks: item.remarks,
          photos: item.photos,
          order,
        }) as OrderItemEntity,
    );
  }

  private splitOrderInput(order: CreateOrderDto | UpdateOrderDto) {
    const { paymentMethodId, shopId, orderItems, ...orderData } = order;

    return {
      orderData: {
        ...orderData,
      },
      orderItems,
    };
  }

  private sanitizeOrder(order: OrderEntity): OrderEntity {
    return {
      ...order,
      orderItems: (order.orderItems ?? []).map(({ order: _, ...item }) => item),
    } as OrderEntity;
  }

  private getToday(): string {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return formatDate(todayStart);
  }

  private toOrderItemRowDto(item: OrderItemEntity): OrderItemRowDto {
    const order = item.order as OrderEntity;

    return {
      orderId: order.id,
      itemId: item.id,
      orderStatus: order.orderStatus,
      customerName: order.customerName,
      deliveryDate: order.deliveryDate,
      deliveryStartTime: order.deliveryStartTime,
      deliveryEndTime: order.deliveryEndTime,
      type: item.type,
      shape: item.shape,
      text: item.text,
      decoration: item.decoration,
      size: item.size,
    };
  }
}
