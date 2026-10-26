import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  DashboardAmount,
  DashboardCountPoint,
  DashboardDistributionPoint,
  DashboardQueryDto,
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
