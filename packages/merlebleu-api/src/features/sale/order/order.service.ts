import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from './order.entity';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import { OrderItemDto } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    private paymentService: PaymentService,
  ) {}

  async addOrder(order: CreateOrderDto): Promise<OrderEntity> {
    const paymentMethod = await this.paymentService.getPaymentMethod(
      order.paymentMethodId,
    );

    const { orderData, orderItems } = this.splitOrderInput(order);
    const orderEntity = this.orderRepository.create({
      ...orderData,
      paymentMethod,
    });

    orderEntity.orderItems = this.buildOrderItems(orderItems, orderEntity);

    return this.orderRepository.save(orderEntity);
  }

  async listOrders(page = 1, limit = 20) {
    const pagination = getPaginationParams({ page, limit });

    const [data, total] = await this.orderRepository.findAndCount({
      relations: { orderItems: true, paymentMethod: true },
      order: { orderDate: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async updateOrder(id: string, order: UpdateOrderDto): Promise<OrderEntity> {
    const existingOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: true, paymentMethod: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const paymentMethod = await this.paymentService.getPaymentMethod(
      order.paymentMethodId,
    );

    const { orderData, orderItems } = this.splitOrderInput(order);

    Object.assign(existingOrder, {
      ...orderData,
      paymentMethod,
    });

    existingOrder.orderItems = this.buildOrderItems(orderItems, existingOrder);

    return this.orderRepository.save(existingOrder);
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
    return items.map((item) =>
      this.orderItemRepository.create({
        description: item.description,
        size: item.size,
        totalAmount: item.totalAmount,
        remarks: item.remarks,
        photos: item.photos,
        order,
      }),
    );
  }

  private splitOrderInput(order: CreateOrderDto | UpdateOrderDto) {
    const { paymentMethodId, orderItems, ...orderData } = order;

    return {
      orderData,
      orderItems,
    };
  }
}
