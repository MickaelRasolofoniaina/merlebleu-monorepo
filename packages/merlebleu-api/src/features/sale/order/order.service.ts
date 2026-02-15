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
    private paymentService: PaymentService,
  ) {}

  async addOrder(order: CreateOrderDto): Promise<OrderEntity> {
    const paymentMethod = await this.paymentService.getPaymentMethod(
      order.paymentMethodId,
    );

    const { orderData, orderItems } = this.splitOrderInput(order);
    const orderEntity = {
      ...orderData,
      paymentMethod,
    } as OrderEntity;

    orderEntity.orderItems = this.buildOrderItems(orderItems, orderEntity);

    const savedOrder = await this.orderRepository.save(orderEntity);

    return this.sanitizeOrder(savedOrder);
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
      data: data.map((order) => this.sanitizeOrder(order)),
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

    const savedOrder = await this.orderRepository.save(existingOrder);

    return this.sanitizeOrder(savedOrder);
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
          totalAmount: item.totalAmount,
          remarks: item.remarks,
          photos: item.photos,
          order,
        }) as OrderItemEntity,
    );
  }

  private splitOrderInput(order: CreateOrderDto | UpdateOrderDto) {
    const { paymentMethodId, orderItems, ...orderData } = order;

    return {
      orderData,
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
