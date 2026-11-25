import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity, OrderItemSchema } from './order.entity';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import {
  NotificationType,
  OrderItemDto,
  OrderItemRowDto,
  OrderStatus,
  ResultPaged,
  UserRole,
} from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { formatDate } from '@shared/date/date.utils';
import { PaymentService } from '../payment/payment.service';
import { ShopService } from '../../shop/shop.service';
import { NotificationService } from '../../notification/notification.service';

const PASTRY_NOTIFICATION_ROLES = [UserRole.PASTRY_CHEF, UserRole.ADMIN];
const CASHIER_NOTIFICATION_ROLES = [UserRole.CASHIER, UserRole.ADMIN];
const TODAY_TO_DELIVER_STATUSES = [OrderStatus.TODO, OrderStatus.TODELIVER];

const LATE_ORDER_STATUSES = [
  OrderStatus.TODO,
  OrderStatus.INPROGRESS,
  OrderStatus.TODELIVER,
];

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemSchema)
    private orderItemRepository: Repository<OrderItemEntity>,
    private paymentService: PaymentService,
    private shopService: ShopService,
    private notificationService: NotificationService,
  ) {}

  async addOrder(
    order: CreateOrderDto,
    actorName: string,
  ): Promise<OrderEntity> {
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

    await this.notify(NotificationType.ORDER_CREATED, {
      orderId: savedOrder.id,
      customerName: savedOrder.customerName,
      actorName,
      targetRoles: PASTRY_NOTIFICATION_ROLES,
    });

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
      excludeDelivered?: boolean;
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
    } else if (filters?.excludeDelivered) {
      query.andWhere('orders.orderStatus != :deliveredStatus', {
        deliveredStatus: OrderStatus.DELIVERED,
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

  async listOrdersToPrepare(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
    orderDate?: string,
    deliveryDate?: string,
  ): Promise<ResultPaged<OrderEntity>> {
    return this.listOrders(page, limit, {
      deliveryDateFrom: this.getDayAfterTomorrow(),
      customerName,
      shopId,
      status: status === OrderStatus.TODO ? status : undefined,
      statuses: [OrderStatus.TODO],
      orderDate,
      deliveryDate,
    });
  }

  async listOrdersLate(
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
      deliveryDateTo: today,
      customerName,
      shopId,
      status: status && LATE_ORDER_STATUSES.includes(status) ? status : undefined,
      statuses: LATE_ORDER_STATUSES,
      orderDate,
      deliveryDate,
    });
  }

  /** Orders to prepare today: delivery today or tomorrow and status TODO. */
  async listOrdersTodayToPrepare(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
  ): Promise<ResultPaged<OrderEntity>> {
    return this.listOrders(page, limit, {
      deliveryDateFrom: this.getToday(),
      deliveryDateTo: this.getDayAfterTomorrow(),
      status: OrderStatus.TODO,
      customerName,
      shopId,
    });
  }

  /** Orders to deliver today: delivery date is today, status TODO or TODELIVER. */
  async listOrdersTodayToDeliver(
    page = 1,
    limit = 20,
    customerName?: string,
    shopId?: string,
    status?: OrderStatus,
  ): Promise<ResultPaged<OrderEntity>> {
    return this.listOrders(page, limit, {
      deliveryDate: this.getToday(),
      status: status && TODAY_TO_DELIVER_STATUSES.includes(status) ? status : undefined,
      statuses: TODAY_TO_DELIVER_STATUSES,
      customerName,
      shopId,
    });
  }

  async listOrderItemsTodayToPrepare(
    page = 1,
    limit = 20,
  ): Promise<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItems(page, limit, {
      deliveryDateFrom: this.getToday(),
      deliveryDateTo: this.getDayAfterTomorrow(),
      statuses: [OrderStatus.TODO],
    });
  }

  async listOrderItemsTodayToDeliver(
    page = 1,
    limit = 20,
  ): Promise<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItems(page, limit, {
      deliveryDate: this.getToday(),
      statuses: TODAY_TO_DELIVER_STATUSES,
    });
  }

  async listOrderItemsToDeliver(
    page = 1,
    limit = 20,
  ): Promise<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItems(page, limit, {
      deliveryDateFrom: this.getToday(),
      statuses: [OrderStatus.TODELIVER],
    });
  }

  async listOrderItemsLate(
    page = 1,
    limit = 20,
  ): Promise<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItems(page, limit, {
      deliveryDateTo: this.getToday(),
      statuses: LATE_ORDER_STATUSES,
    });
  }

  async listOrderItemsToPrepare(
    page = 1,
    limit = 20,
  ): Promise<ResultPaged<OrderItemRowDto>> {
    return this.listOrderItems(page, limit, {
      deliveryDateFrom: this.getDayAfterTomorrow(),
      statuses: [OrderStatus.TODO],
    });
  }

  private async listOrderItems(
    page: number,
    limit: number,
    filters: {
      deliveryDate?: string;
      deliveryDateFrom?: string;
      deliveryDateTo?: string;
      statuses: OrderStatus[];
    },
  ): Promise<ResultPaged<OrderItemRowDto>> {
    const pagination = getPaginationParams({ page, limit });

    const query = this.orderItemRepository
      .createQueryBuilder('orderItems')
      .innerJoinAndSelect('orderItems.order', 'orders')
      .orderBy('orders.deliveryDate', 'ASC')
      .addOrderBy('orders.deliveryStartTime', 'ASC')
      .addOrderBy('orders.id', 'ASC');

    if (filters.deliveryDate) {
      query.andWhere('orders.deliveryDate = :deliveryDate', {
        deliveryDate: filters.deliveryDate,
      });
    }

    if (filters.deliveryDateFrom) {
      query.andWhere('orders.deliveryDate >= :deliveryDateFrom', {
        deliveryDateFrom: filters.deliveryDateFrom,
      });
    }

    if (filters.deliveryDateTo) {
      query.andWhere('orders.deliveryDate < :deliveryDateTo', {
        deliveryDateTo: filters.deliveryDateTo,
      });
    }

    query.andWhere('orders.orderStatus IN (:...statuses)', {
      statuses: filters.statuses,
    });

    query.take(pagination.limit).skip(pagination.skip);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((item) => this.toOrderItemRowDto(item)),
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

  async updateOrder(
    id: string,
    order: UpdateOrderDto,
    actorName: string,
  ): Promise<OrderEntity> {
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

    await this.notify(NotificationType.ORDER_UPDATED, {
      orderId: savedOrder.id,
      customerName: savedOrder.customerName,
      actorName,
      targetRoles: PASTRY_NOTIFICATION_ROLES,
    });

    return this.sanitizeOrder(savedOrder);
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    actorName: string,
  ): Promise<boolean> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: false, paymentMethod: false },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    existingOrder.orderStatus = status;

    await this.orderRepository.save(existingOrder);

    if (status === OrderStatus.TODELIVER) {
      await this.notify(NotificationType.ORDER_READY, {
        orderId: existingOrder.id,
        customerName: existingOrder.customerName,
        actorName,
        targetRoles: CASHIER_NOTIFICATION_ROLES,
      });
    }

    return true;
  }

  async deliverOrder(
    id: string,
    paymentMethodId: string,
  ): Promise<OrderEntity> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: true, paymentMethod: true, shop: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    if (
      existingOrder.orderStatus === OrderStatus.CANCELLED ||
      existingOrder.orderStatus === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Une commande annulée ou déjà livrée ne peut pas être livrée.',
      );
    }

    const paymentMethod =
      await this.paymentService.getPaymentMethod(paymentMethodId);

    const totalDue = existingOrder.totalAmount + existingOrder.deliveryFee;
    const balanceDue = Math.max(totalDue - existingOrder.paidAmount, 0);

    // the deposit keeps its original payment method; only the remaining
    // balance is attributed to the method chosen at delivery
    if (existingOrder.paidAmount <= 0) {
      existingOrder.paymentMethod = paymentMethod;
    }
    existingOrder.balancePaymentMethod = paymentMethod;
    existingOrder.balancePaidAmount = balanceDue;
    existingOrder.paidAmount = totalDue;
    existingOrder.balanceAmount = 0;
    existingOrder.orderStatus = OrderStatus.DELIVERED;

    const savedOrder = await this.orderRepository.save(existingOrder);

    return this.sanitizeOrder(savedOrder);
  }

  async deleteOrder(id: string, actorName: string): Promise<void> {
    const existingOrder = await this.orderRepository.findOneBy({ id });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    await this.orderRepository.delete(id);

    await this.notify(NotificationType.ORDER_DELETED, {
      orderId: id,
      customerName: existingOrder.customerName,
      actorName,
      targetRoles: PASTRY_NOTIFICATION_ROLES,
    });
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

  // a failed notification must not fail an order change that is already saved
  private async notify(
    ...args: Parameters<NotificationService['create']>
  ): Promise<void> {
    try {
      await this.notificationService.create(...args);
    } catch (error) {
      this.logger.error(
        `Failed to create notification ${String(args[0])}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
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

  private getDayAfterTomorrow(): string {
    const now = new Date();
    const dayAfterTomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2,
    );

    return formatDate(dayAfterTomorrowStart);
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
