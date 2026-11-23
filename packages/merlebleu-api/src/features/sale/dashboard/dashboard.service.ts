import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import {
  DashboardAmount,
  DashboardCountPoint,
  DashboardDistributionPoint,
  DashboardQueryDto,
  DashboardTodaySummary,
  DashboardView,
  OrderStatus,
} from '@merlebleu/shared';
import {
  OrderEntity,
  OrderItemEntity,
  OrderItemSchema,
} from '../order/order.entity';
import {
  DateRange,
  fillMonthPoints,
  fillYearPoints,
  getPeriodRange,
} from './dashboard.period';
import { formatDate } from '@shared/date/date.utils';


@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemSchema)
    private orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  async getOrdersCount(query: DashboardQueryDto): Promise<DashboardCountPoint[]> {
    const isYearView = query.view === DashboardView.YEAR;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('orders')
      .select(
        `EXTRACT(${isYearView ? 'YEAR' : 'MONTH'} FROM orders.orderDate)`,
        'period',
      )
      .addSelect('COUNT(*)', 'count')
      .where('orders.orderStatus != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy('period')
      .orderBy('period', 'ASC');

    if (!isYearView) {
      // the month view shows the 12 months of the chosen year
      this.filterByRange(
        queryBuilder,
        getPeriodRange(DashboardView.YEAR, query.year),
      );
    }

    const rows = (
      await queryBuilder.getRawMany<{ period: string; count: string }>()
    ).map((row) => ({ period: Number(row.period), count: Number(row.count) }));

    return isYearView
      ? fillYearPoints(rows, new Date().getFullYear())
      : fillMonthPoints(rows);
  }

  getOrdersByType(query: DashboardQueryDto): Promise<DashboardDistributionPoint[]> {
    return this.getDistribution('type', query);
  }

  getOrdersByShape(query: DashboardQueryDto): Promise<DashboardDistributionPoint[]> {
    return this.getDistribution('shape', query);
  }

  async getOrdersAmount(query: DashboardQueryDto): Promise<DashboardAmount> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('orders')
      .select('COALESCE(SUM(orders.totalAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'ordersCount')
      .where('orders.orderStatus != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      });

    this.filterByRange(queryBuilder, this.resolveRange(query));

    const row = await queryBuilder.getRawOne<{
      total: string;
      ordersCount: string;
    }>();

    return {
      total: Number(row?.total ?? 0),
      ordersCount: Number(row?.ordersCount ?? 0),
    };
  }

  /**
   * Summary of the current day. Delivered orders and the collected amount are
   * based on the delivery date since the delivery time is not stored.
   */
  async getTodaySummary(): Promise<DashboardTodaySummary> {
    const now = new Date();
    const today = formatDate(now);
    const tomorrow = formatDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    );

    const [createdCount, toPrepareCount, toDeliverCount, delivered] =
      await Promise.all([
        this.orderRepository.count({
          where: { orderDate: today, orderStatus: Not(OrderStatus.CANCELLED) },
        }),
        // same rule as the "to prepare" page: delivery today or tomorrow
        this.orderRepository.count({
          where: {
            orderStatus: OrderStatus.TODO,
            deliveryDate: Between(today, tomorrow),
          },
        }),
        this.orderRepository.count({
          where: {
            deliveryDate: today,
            orderStatus: In([OrderStatus.TODO, OrderStatus.TODELIVER]),
          },
        }),
        this.orderRepository
          .createQueryBuilder('orders')
          .select('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(orders.paidAmount), 0)', 'amount')
          .where('orders.deliveryDate = :today', { today })
          .andWhere('orders.orderStatus = :delivered', {
            delivered: OrderStatus.DELIVERED,
          })
          .getRawOne<{ count: string; amount: string }>(),
      ]);

    return {
      createdCount,
      toPrepareCount,
      toDeliverCount,
      deliveredCount: Number(delivered?.count ?? 0),
      collectedAmount: Number(delivered?.amount ?? 0),
    };
  }

  // an order with several items of the same type or shape is counted once
  private async getDistribution(
    column: 'type' | 'shape',
    query: DashboardQueryDto,
  ): Promise<DashboardDistributionPoint[]> {
    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItems')
      .innerJoin('orderItems.order', 'orders')
      .select(`orderItems.${column}`, 'label')
      .addSelect('COUNT(DISTINCT orders.id)', 'count')
      .where('orders.orderStatus != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy(`orderItems.${column}`)
      .orderBy('count', 'DESC');

    this.filterByRange(queryBuilder, this.resolveRange(query));

    const rows = await queryBuilder.getRawMany<{
      label: string;
      count: string;
    }>();

    return rows.map((row) => ({ label: row.label, count: Number(row.count) }));
  }

  private resolveRange(query: DashboardQueryDto): DateRange {
    if (query.view === DashboardView.MONTH && query.month === undefined) {
      throw new BadRequestException('Le mois est requis pour la vue par mois.');
    }

    return getPeriodRange(query.view, query.year, query.month);
  }

  private filterByRange(
    queryBuilder: SelectQueryBuilder<any>,
    range: DateRange,
  ): void {
    queryBuilder.andWhere(
      'orders.orderDate >= :from AND orders.orderDate < :to',
      range,
    );
  }
}
