import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from './order.entity';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import { OrderItemDto, OrderStatus, ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { formatDate } from '@shared/date/date.utils';
import { PaymentService } from '../payment/payment.service';
import { ShopService } from '../../shop/shop.service';

const TALATAMATY_SHOP_ID = 'd644ffcf-c069-4d1d-8e45-b5fa93c38b3b';
const ANOSY_AVARATRA_SHOP_ID = '0ac4b6aa-c3b5-43f5-8f8f-67257b4fb7fb';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
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
      shopId?: string;
    },
  ): Promise<ResultPaged<OrderEntity>> {
    const pagination = getPaginationParams({ page, limit });

    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.orderItems', 'orderItems')
      .leftJoinAndSelect('orders.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('orders.shop', 'shop')
      .orderBy('orders.deliveryDate', 'ASC');

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
  ): Promise<ResultPaged<OrderEntity>> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    return this.listOrders(page, limit, {
      deliveryDateFrom: formatDate(todayStart),
      deliveryDateTo: formatDate(tomorrowStart),
      shopId: TALATAMATY_SHOP_ID,
      customerName,
    });
  }

  async listOrdersToPrepare(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
  ): Promise<ResultPaged<OrderEntity>> {
    const pagination = getPaginationParams({ page, limit });

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const today = formatDate(todayStart);
    const tomorrow = formatDate(tomorrowStart);

    const query = this.orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.orderItems', 'orderItems')
      .leftJoinAndSelect('orders.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('orders.shop', 'shop')
      .orderBy('orders.deliveryDate', 'ASC')
      .where(
        new Brackets((qb) => {
          qb.where(
            'CAST(orders.deliveryDate AS date) = :tomorrow AND shop.id = :talatamatyShopId',
            { tomorrow, talatamatyShopId: TALATAMATY_SHOP_ID },
          ).orWhere(
            'CAST(orders.deliveryDate AS date) = :today AND shop.id = :anosyAvaratraShopId',
            { today, anosyAvaratraShopId: ANOSY_AVARATRA_SHOP_ID },
          );
        }),
      );

    if (customerName) {
      query.andWhere('orders.customerName ILIKE :customerName', {
        customerName: `%${customerName}%`,
      });
    }

    if (shopId) {
      query.andWhere('shop.id = :filterShopId', { filterShopId: shopId });
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
          description: item.description,
          size: item.size,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
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
}
