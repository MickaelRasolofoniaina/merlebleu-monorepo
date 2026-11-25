import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  LessThanOrEqual,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  DashboardAmount,
  DashboardCollectionByMethod,
  DashboardCountPoint,
  DashboardDistributionPoint,
  DashboardOrderListSummary,
  DashboardProductionLine,
  DashboardQueryDto,
  DashboardTodayDetails,
  DashboardTodaySummary,
  DashboardView,
  DEFAULT_PAYMENT_METHOD_COLOR,
  ExpenseNature,
  OrderStatus,
} from '@merlebleu/shared';
import { ExpenseEntity } from '../../expense/expense.entity';
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
    @InjectRepository(ExpenseEntity)
    private expenseRepository: Repository<ExpenseEntity>,
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
        // same rule as the "to prepare" page: delivery today or tomorrow,
        // counted per order item (child) rather than per order (parent)
        this.orderItemRepository
          .createQueryBuilder('orderItems')
          .innerJoin('orderItems.order', 'orders')
          .where('orders.orderStatus = :todo', { todo: OrderStatus.TODO })
          .andWhere('orders.deliveryDate BETWEEN :today AND :tomorrow', {
            today,
            tomorrow,
          })
          .getCount(),
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

  /**
   * Detailed figures of the current day: late orders, deliveries timeline,
   * production, collections by payment method and expenses. Collections follow
   * the same rule as the today summary (delivered orders, by delivery date).
   */
  async getTodayDetails(): Promise<DashboardTodayDetails> {
    const now = new Date();
    const today = formatDate(now);
    const tomorrow = formatDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    );
    const pendingStatuses = [
      OrderStatus.TODO,
      OrderStatus.INPROGRESS,
      OrderStatus.TODELIVER,
    ];

    const [late, todayOrders, collections, expenses, unpaidFixed, tomorrowCount] =
      await Promise.all([
        this.orderRepository
          .createQueryBuilder('orders')
          .select('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(orders.balanceAmount), 0)', 'balance')
          .where('orders.deliveryDate < :today', { today })
          .andWhere('orders.orderStatus IN (:...pendingStatuses)', {
            pendingStatuses,
          })
          .getRawOne<{ count: string; balance: string }>(),
        this.orderRepository.find({
          where: {
            deliveryDate: today,
            orderStatus: Not(OrderStatus.CANCELLED),
          },
          relations: { orderItems: true, shop: true },
          order: { deliveryStartTime: 'ASC' },
        }),
        this.orderRepository.find({
          where: { deliveryDate: today, orderStatus: OrderStatus.DELIVERED },
          relations: { paymentMethod: true, balancePaymentMethod: true },
        }),
        this.expenseRepository.find({ where: { date: today } }),
        this.expenseRepository.count({
          where: {
            nature: ExpenseNature.FIXED,
            paid: false,
            date: LessThanOrEqual(today),
          },
        }),
        this.orderRepository.count({
          where: {
            deliveryDate: tomorrow,
            orderStatus: In(pendingStatuses),
          },
        }),
      ]);

    const pendingToday = todayOrders.filter((order) =>
      pendingStatuses.includes(order.orderStatus as OrderStatus),
    );

    // same rule as the "to prepare" counter: orders still TODO delivered today or tomorrow
    const toPrepareOrders = await this.orderRepository.find({
      where: {
        deliveryDate: Between(today, tomorrow),
        orderStatus: OrderStatus.TODO,
      },
      relations: { orderItems: true },
    });

    const productionMap = new Map<string, DashboardProductionLine>();
    let customizedOrdersCount = 0;
    for (const order of toPrepareOrders) {
      if (order.orderItems.some((item) => item.text || item.decoration)) {
        customizedOrdersCount++;
      }
      for (const item of order.orderItems) {
        const key = `${item.shape}|${item.size}`;
        const line = productionMap.get(key) ?? {
          shape: item.shape,
          size: item.size,
          count: 0,
        };
        line.count++;
        productionMap.set(key, line);
      }
    }

    return {
      lateCount: Number(late?.count ?? 0),
      lateBalanceAmount: Number(late?.balance ?? 0),
      balanceToCollectToday: pendingToday.reduce(
        (sum, order) => sum + order.balanceAmount,
        0,
      ),
      deliveries: todayOrders.map((order) => ({
        id: order.id,
        startTime: order.deliveryStartTime.slice(0, 5),
        endTime: order.deliveryEndTime.slice(0, 5),
        customerName: order.customerName,
        shopAddress: order.shop?.address ?? '',
        isPickup: !order.deliveryAddress,
        itemsLabel: order.orderItems
          .map((item) => `${item.type} ${item.shape} ${item.size} cm`)
          .join(', '),
        status: order.orderStatus ?? OrderStatus.TODO,
        balanceAmount: order.balanceAmount,
      })),
      production: [...productionMap.values()].sort(
        (a, b) => b.count - a.count || a.size - b.size,
      ),
      customizedOrdersCount,
      collectionsByMethod: this.groupCollectionsByMethod(collections),
      expenses: expenses.map((expense) => ({
        id: expense.id,
        label:
          expense.label ??
          expense.ingredient?.label ??
          expense.category?.label ??
          '',
        origin: expense.ingredient
          ? 'INGREDIENT'
          : expense.category
            ? 'CATEGORY'
            : 'FIXED',
        amount: expense.amount,
        // variable expenses have no paid flag: they are paid when entered
        paid: expense.paid !== false,
      })),
      unpaidFixedExpensesCount: unpaidFixed,
      tomorrowDeliveriesCount: tomorrowCount,
    };
  }

  /**
   * Figures shown above the order list. The collected amount follows the same
   * rule as the today summary. "This week" runs from Monday to Sunday and
   * includes today; only orders still to deliver are counted.
   */
  async getOrderListSummary(): Promise<DashboardOrderListSummary> {
    const now = new Date();
    const today = formatDate(now);
    const daysSinceMonday = (now.getDay() + 6) % 7;
    const weekStart = formatDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday),
    );
    const weekEnd = formatDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - daysSinceMonday + 6,
      ),
    );
    const closedStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

    const [balance, collected, toDeliverToday, toDeliverThisWeek] =
      await Promise.all([
        this.orderRepository
          .createQueryBuilder('orders')
          .select('COALESCE(SUM(orders.balanceAmount), 0)', 'amount')
          .where('orders.orderStatus NOT IN (:...closedStatuses)', {
            closedStatuses,
          })
          .getRawOne<{ amount: string }>(),
        this.orderRepository
          .createQueryBuilder('orders')
          .select('COALESCE(SUM(orders.paidAmount), 0)', 'amount')
          .where('orders.deliveryDate = :today', { today })
          .andWhere('orders.orderStatus = :delivered', {
            delivered: OrderStatus.DELIVERED,
          })
          .getRawOne<{ amount: string }>(),
        this.orderRepository.count({
          where: { deliveryDate: today, orderStatus: Not(In(closedStatuses)) },
        }),
        this.orderRepository.count({
          where: {
            deliveryDate: Between(weekStart, weekEnd),
            orderStatus: Not(In(closedStatuses)),
          },
        }),
      ]);

    return {
      balanceToCollect: Number(balance?.amount ?? 0),
      collectedToday: Number(collected?.amount ?? 0),
      toDeliverToday,
      toDeliverThisWeek,
    };
  }

  // the deposit is attributed to the order's payment method and the balance
  // collected at delivery to the method chosen then
  private groupCollectionsByMethod(
    orders: OrderEntity[],
  ): DashboardCollectionByMethod[] {
    const totals = new Map<string, DashboardCollectionByMethod>();
    const add = (
      method: { name: string; color: string } | null | undefined,
      amount: number,
    ) => {
      if (amount <= 0) {
        return;
      }
      const name = method?.name ?? 'Non défini';
      const row = totals.get(name) ?? {
        name,
        color: method?.color ?? DEFAULT_PAYMENT_METHOD_COLOR,
        amount: 0,
      };
      row.amount += amount;
      totals.set(name, row);
    };

    for (const order of orders) {
      const balancePaid = order.balancePaidAmount ?? 0;
      add(order.paymentMethod, order.paidAmount - balancePaid);
      add(order.balancePaymentMethod ?? order.paymentMethod, balancePaid);
    }

    return [...totals.values()].sort((a, b) => b.amount - a.amount);
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
