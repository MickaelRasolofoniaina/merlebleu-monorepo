import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  CashClosing,
  CashCount,
  ClosingPreview,
  CreateClosingDto,
  Movement,
  MovementPage,
  MovementType,
  OrderStatus,
  ReceiptSummary,
  Wallet,
  WalletSummary,
} from '@merlebleu/shared';
import { formatDate } from '../../shared/date/date.utils';
import { OrderEntity } from '../sale/order/order.entity';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import {
  CashClosingEntity,
  CashCountEntity,
  OrderRefundEntity,
  WalletTransferEntity,
} from './treasury.entity';
import {
  CreateCashCountDto,
  CreateRefundDto,
  CreateTransferDto,
  ExportMovementsQueryDto,
  ListMovementsQueryDto,
  ReceiptQueryDto,
  UpdateWalletDto,
} from './treasury.dto';
import {
  INCOME_TYPES_SQL,
  MOVEMENTS_CTE,
  MOVEMENTS_SINCE_CTE,
  MOVEMENTS_WITH_HISTORY_CTE,
  OUTFLOW_TYPES_SQL,
} from './treasury.sql';
import {
  PeriodLockService,
  toFrenchDate,
} from './period-lock/period-lock.service';
import { buildReceiptSummary, ReceiptMovementRow } from './treasury.receipt';
import { getReceiptRange } from './treasury.period';

interface MovementRow {
  id: string;
  date: string;
  type: MovementType;
  label: string;
  walletId: string | null;
  walletName: string | null;
  walletColor: string | null;
  amount: number;
  orderId: string | null;
  expenseId: string | null;
  running: string | null;
}

type MovementFilters = Omit<ExportMovementsQueryDto, never>;

/** Serializes the closings and reopenings, so two admins cannot close the cash at once. */
const CLOSING_LOCK_KEY = 4_120_261_126;

@Injectable()
export class TreasuryService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PaymentMethodEntity)
    private readonly walletRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(WalletTransferEntity)
    private readonly transferRepository: Repository<WalletTransferEntity>,
    @InjectRepository(OrderRefundEntity)
    private readonly refundRepository: Repository<OrderRefundEntity>,
    @InjectRepository(CashCountEntity)
    private readonly cashCountRepository: Repository<CashCountEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(CashClosingEntity)
    private readonly closingRepository: Repository<CashClosingEntity>,
    private readonly periodLock: PeriodLockService,
  ) {}

  /* ---------------------------------- wallets --------------------------------- */

  async getWallets(): Promise<WalletSummary> {
    const today = formatDate(new Date());
    const monthStart = `${today.slice(0, 7)}-01`;

    const [methods, totals, monthTotals, counts, frozen, lastClosingDate] =
      await Promise.all([
        this.walletRepository.find({ order: { name: 'ASC' } }),
        // balances only read the movements after the latest closing
        this.dataSource.query<{ walletId: string | null; balance: string }[]>(
          `${MOVEMENTS_CTE}
           SELECT "walletId", SUM(amount) AS balance FROM f GROUP BY "walletId"`,
        ),
        this.dataSource.query<
          { walletId: string | null; income: string; outflow: string }[]
        >(
          `${MOVEMENTS_SINCE_CTE}
           SELECT "walletId",
             COALESCE(SUM(amount) FILTER (WHERE type IN ${INCOME_TYPES_SQL}), 0) AS income,
             COALESCE(-SUM(amount) FILTER (WHERE type IN ${OUTFLOW_TYPES_SQL}), 0) AS outflow
           FROM f GROUP BY "walletId"`,
          [monthStart],
        ),
        this.cashCountRepository.find({
          relations: { wallet: true },
          order: { date: 'DESC', createdAt: 'DESC' },
        }),
        this.dataSource.query<{ walletId: string; frozenAmount: number }[]>(
          `SELECT l."walletId", l."frozenAmount"
           FROM cash_closing_lines l JOIN cash_closings c ON c.id = l."closingId"
           WHERE c.date = (SELECT MAX(date) FROM cash_closings)`,
        ),
        this.periodLock.getLockedUntil(),
      ]);

    const totalsByWallet = new Map(totals.map((row) => [row.walletId, row]));
    const monthByWallet = new Map(
      monthTotals.map((row) => [row.walletId, row]),
    );
    const frozenByWallet = new Map(
      frozen.map((row) => [row.walletId, Number(row.frozenAmount)]),
    );
    const lastCountByWallet = new Map<string, CashCountEntity>();
    for (const count of counts) {
      if (!lastCountByWallet.has(count.wallet.id)) {
        lastCountByWallet.set(count.wallet.id, count);
      }
    }

    const wallets: Wallet[] = methods.map((method) => {
      const row = totalsByWallet.get(method.id);
      const month = monthByWallet.get(method.id);
      const count = lastCountByWallet.get(method.id);
      return {
        id: method.id,
        name: method.name,
        color: method.color,
        openingBalance: method.openingBalance,
        openingDate: method.openingDate,
        archived: method.archived,
        balance: Number(row?.balance ?? 0),
        monthIncome: Number(month?.income ?? 0),
        monthOutflow: Number(month?.outflow ?? 0),
        lastCashCount: count
          ? {
              date: count.date,
              countedAmount: count.countedAmount,
              expectedAmount: count.expectedAmount,
              gap: count.countedAmount - count.expectedAmount,
            }
          : null,
        frozenAmount: frozenByWallet.get(method.id) ?? null,
      };
    });

    return {
      wallets,
      totalBalance: wallets
        .filter((wallet) => !wallet.archived)
        .reduce((sum, wallet) => sum + wallet.balance, 0),
      undefinedBalance: Number(totalsByWallet.get(null)?.balance ?? 0),
      lastClosingDate,
    };
  }

  async updateWallet(id: string, dto: UpdateWalletDto): Promise<void> {
    const wallet = await this.getWallet(id);
    Object.assign(wallet, dto);
    await this.walletRepository.save(wallet);
  }

  /* -------------------------------- movements --------------------------------- */

  async listMovements(query: ListMovementsQueryDto): Promise<MovementPage> {
    const { clause, params } = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;

    const [rows, totals, lockedUntil] = await Promise.all([
      this.dataSource.query<MovementRow[]>(
        `${MOVEMENTS_WITH_HISTORY_CTE}
         SELECT * FROM f ${clause}
         ORDER BY date DESC, ord DESC, id DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.limit, offset],
      ),
      this.dataSource.query<
        { total: string; income: string; outflow: string }[]
      >(
        `${MOVEMENTS_WITH_HISTORY_CTE}
         SELECT COUNT(*) AS total,
           COALESCE(SUM(amount) FILTER (WHERE type IN ${INCOME_TYPES_SQL}), 0) AS income,
           COALESCE(-SUM(amount) FILTER (WHERE type IN ${OUTFLOW_TYPES_SQL}), 0) AS outflow
         FROM f ${clause}`,
        params,
      ),
      this.periodLock.getLockedUntil(),
    ]);

    const singleWallet = Boolean(query.walletId && query.walletId !== 'none');
    return {
      data: rows.map((row) => this.toMovement(row, singleWallet)),
      total: Number(totals[0]?.total ?? 0),
      page: query.page,
      limit: query.limit,
      totals: {
        income: Number(totals[0]?.income ?? 0),
        outflow: Number(totals[0]?.outflow ?? 0),
      },
      lockedUntil,
    };
  }

  /** Semicolon-separated CSV (Excel in French locales), UTF-8 with BOM. */
  async exportMovementsCsv(query: ExportMovementsQueryDto): Promise<string> {
    const { clause, params } = this.buildWhere(query);
    const rows = await this.dataSource.query<MovementRow[]>(
      `${MOVEMENTS_WITH_HISTORY_CTE} SELECT * FROM f ${clause} ORDER BY date DESC, ord DESC, id DESC`,
      params,
    );

    const escape = (value: string | number): string => {
      const text = String(value);
      return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = rows.map((row) =>
      [
        row.date,
        row.type,
        row.label,
        row.walletName ?? 'Non défini',
        row.amount,
      ]
        .map(escape)
        .join(';'),
    );

    return (
      '﻿' + ['Date;Type;Libellé;Portefeuille;Montant', ...lines].join('\r\n')
    );
  }

  /* --------------------------------- receipts --------------------------------- */

  async getReceipts(query: ReceiptQueryDto): Promise<ReceiptSummary> {
    const range = getReceiptRange(query.period, query.date);
    const [rows, wallets] = await Promise.all([
      this.dataSource.query<MovementRow[]>(
        `${MOVEMENTS_SINCE_CTE}
         SELECT * FROM f
         WHERE date <= $2 AND type NOT IN ('OPENING','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT')
         ORDER BY date ASC, ord ASC, id ASC`,
        [range.from, range.to],
      ),
      this.walletRepository.find({ order: { name: 'ASC' } }),
    ]);

    const movementRows: ReceiptMovementRow[] = rows.map((row) => ({
      date: row.date,
      type: row.type,
      label: row.label,
      walletId: row.walletId,
      amount: Number(row.amount),
    }));

    return buildReceiptSummary(query.period, range, movementRows, wallets);
  }

  /* ------------------------------ writes (admin) ------------------------------ */

  async createTransfer(dto: CreateTransferDto): Promise<void> {
    await this.periodLock.assertOpen(dto.date);
    const [from, to] = await Promise.all([
      this.getWallet(dto.fromWalletId),
      this.getWallet(dto.toWalletId),
    ]);
    if (from.archived || to.archived) {
      throw new BadRequestException(
        'Un portefeuille archivé ne peut pas recevoir de virement.',
      );
    }

    await this.transferRepository.save(
      this.transferRepository.create({
        fromWallet: from,
        toWallet: to,
        amount: dto.amount,
        date: dto.date,
        note: dto.note || null,
      }),
    );
  }

  async createRefund(dto: CreateRefundDto): Promise<void> {
    await this.periodLock.assertOpen(dto.date);
    const order = await this.orderRepository.findOneBy({ id: dto.orderId });
    if (!order) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }
    if (order.orderStatus !== OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Seul l’acompte d’une commande annulée peut être remboursé.',
      );
    }
    const wallet = await this.getWallet(dto.walletId);

    const deposit = order.paidAmount - (order.balancePaidAmount ?? 0);
    const refunded = await this.refundRepository
      .createQueryBuilder('refund')
      .select('COALESCE(SUM(refund.amount), 0)', 'total')
      .where('refund.orderId = :orderId', { orderId: order.id })
      .getRawOne<{ total: string }>();
    const refundable = deposit - Number(refunded?.total ?? 0);

    if (dto.amount > refundable) {
      throw new BadRequestException(
        `Le montant dépasse l’acompte remboursable (${refundable} Ar).`,
      );
    }

    await this.refundRepository.save(
      this.refundRepository.create({
        order,
        wallet,
        amount: dto.amount,
        date: dto.date,
        reason: dto.reason || null,
      }),
    );
  }

  async createCashCount(dto: CreateCashCountDto): Promise<CashCount> {
    await this.periodLock.assertOpen(dto.date);
    const wallet = await this.getWallet(dto.walletId);
    const [row] = await this.dataSource.query<{ balance: string }[]>(
      `${MOVEMENTS_CTE}
       SELECT COALESCE(SUM(amount), 0) AS balance FROM f
       WHERE "walletId" = $1 AND date <= $2`,
      [wallet.id, dto.date],
    );
    const expectedAmount = Number(row?.balance ?? 0);

    const saved = await this.cashCountRepository.save(
      this.cashCountRepository.create({
        wallet,
        date: dto.date,
        countedAmount: dto.countedAmount,
        expectedAmount,
        note: dto.note || null,
      }),
    );

    return {
      id: saved.id,
      walletId: wallet.id,
      date: saved.date,
      countedAmount: saved.countedAmount,
      expectedAmount,
      gap: saved.countedAmount - expectedAmount,
      note: saved.note,
    };
  }

  async listCashCounts(walletId: string, limit = 5): Promise<CashCount[]> {
    const counts = await this.cashCountRepository.find({
      where: { wallet: { id: walletId } },
      order: { date: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return counts.map((count) => ({
      id: count.id,
      walletId,
      date: count.date,
      countedAmount: count.countedAmount,
      expectedAmount: count.expectedAmount,
      gap: count.countedAmount - count.expectedAmount,
      note: count.note,
    }));
  }

  /* --------------------------------- closings --------------------------------- */

  async listClosings(): Promise<CashClosing[]> {
    const closings = await this.closingRepository.find({
      relations: { lines: { wallet: true } },
      order: { date: 'DESC' },
    });
    return closings.map((closing, index) =>
      this.toClosing(closing, index === 0),
    );
  }

  /** Balances the admin is about to freeze at `date`, and what to check before doing it. */
  async previewClosing(date: string): Promise<ClosingPreview> {
    const lastClosingDate = await this.periodLock.getLockedUntil();
    this.assertClosingDate(date, lastClosingDate);

    const [wallets, { balances, undefinedCount, undefinedAmount }] =
      await Promise.all([
        this.walletRepository.find({ order: { name: 'ASC' } }),
        this.computeBalances(this.dataSource.manager, date),
      ]);

    return {
      date,
      lastClosingDate,
      wallets: wallets
        .filter((wallet) => !wallet.archived)
        .map((wallet) => ({
          walletId: wallet.id,
          walletName: wallet.name,
          walletColor: wallet.color,
          calculatedAmount: balances.get(wallet.id) ?? 0,
        })),
      undefinedExpenseCount: undefinedCount,
      undefinedExpenseAmount: undefinedAmount,
    };
  }

  /**
   * Freezes the balance of every wallet at `dto.date`: the counted amount when the wallet was
   * counted, else the calculated one. Archived wallets keep their calculated balance.
   */
  async createClosing(
    dto: CreateClosingDto,
    actorName: string,
  ): Promise<CashClosing> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        CLOSING_LOCK_KEY,
      ]);

      const [last] = await manager.query<{ date: string | null }[]>(
        `SELECT MAX(date)::text AS date FROM cash_closings`,
      );
      this.assertClosingDate(dto.date, last?.date ?? null);

      const { balances } = await this.computeBalances(manager, dto.date);
      const wallets = await manager.find(PaymentMethodEntity, {
        order: { name: 'ASC' },
      });

      const counts = new Map<string, CreateClosingDto['counts'][number]>();
      for (const count of dto.counts) {
        const wallet = wallets.find((item) => item.id === count.walletId);
        if (!wallet) {
          throw new BadRequestException(
            `Wallet with id ${count.walletId} not found`,
          );
        }
        if ((balances.get(wallet.id) ?? 0) !== count.calculatedAmount) {
          throw new ConflictException(
            `Le solde de ${wallet.name} a changé depuis l’aperçu. Recommence la clôture.`,
          );
        }
        counts.set(wallet.id, count);
      }

      const lines = wallets
        .map((wallet) => {
          const calculatedAmount = balances.get(wallet.id) ?? 0;
          const countedAmount = wallet.archived
            ? null
            : (counts.get(wallet.id)?.countedAmount ?? null);
          return {
            wallet,
            calculatedAmount,
            countedAmount,
            frozenAmount: countedAmount ?? calculatedAmount,
          };
        })
        .filter((line) => !line.wallet.archived || line.calculatedAmount !== 0);

      const repository = manager.getRepository(CashClosingEntity);
      const saved = await repository.save(
        repository.create({ date: dto.date, createdBy: actorName, lines }),
      );
      const closing = await repository.findOneOrFail({
        where: { id: saved.id },
        relations: { lines: { wallet: true } },
      });
      return this.toClosing(closing, true);
    });
  }

  /** Reopens the latest closing: its frozen balances and counting gaps are dropped. */
  async reopenLastClosing(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        CLOSING_LOCK_KEY,
      ]);
      const last = await manager.findOne(CashClosingEntity, {
        where: {},
        order: { date: 'DESC' },
      });
      if (!last) {
        throw new NotFoundException('Aucune clôture à rouvrir.');
      }
      await manager.delete(CashClosingEntity, last.id);
    });
  }

  private assertClosingDate(date: string, lastClosingDate: string | null) {
    if (date > formatDate(new Date())) {
      throw new BadRequestException(
        'Impossible de clôturer à une date future.',
      );
    }
    if (lastClosingDate && date <= lastClosingDate) {
      throw new BadRequestException(
        `La date doit être postérieure à la dernière clôture (${toFrenchDate(lastClosingDate)}).`,
      );
    }
  }

  /** Balance of each wallet at the end of `date`, and the expenses with no wallet. */
  private async computeBalances(manager: EntityManager, date: string) {
    const rows = await manager.query<
      { walletId: string | null; balance: string; lines: string }[]
    >(
      `${MOVEMENTS_CTE}
       SELECT "walletId", SUM(amount) AS balance, COUNT(*) AS lines
       FROM f WHERE date <= $1 GROUP BY "walletId"`,
      [date],
    );
    const balances = new Map<string, number>();
    let undefinedCount = 0;
    let undefinedAmount = 0;
    for (const row of rows) {
      if (row.walletId) {
        balances.set(row.walletId, Number(row.balance));
      } else {
        undefinedCount = Number(row.lines);
        undefinedAmount = -Number(row.balance);
      }
    }
    return { balances, undefinedCount, undefinedAmount };
  }

  private toClosing(
    closing: CashClosingEntity,
    reopenable: boolean,
  ): CashClosing {
    const lines = [...closing.lines]
      .sort((a, b) => a.wallet.name.localeCompare(b.wallet.name))
      .map((line) => ({
        walletId: line.wallet.id,
        walletName: line.wallet.name,
        walletColor: line.wallet.color,
        calculatedAmount: line.calculatedAmount,
        countedAmount: line.countedAmount,
        frozenAmount: line.frozenAmount,
        gap: line.frozenAmount - line.calculatedAmount,
      }));
    return {
      id: closing.id,
      date: closing.date,
      createdAt: closing.createdAt.toISOString(),
      createdBy: closing.createdBy,
      totalFrozen: lines.reduce((sum, line) => sum + line.frozenAmount, 0),
      totalGap: lines.reduce((sum, line) => sum + line.gap, 0),
      lines,
      reopenable,
    };
  }

  /* --------------------------------- helpers ---------------------------------- */

  private async getWallet(id: string): Promise<PaymentMethodEntity> {
    const wallet = await this.walletRepository.findOneBy({ id });
    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${id} not found`);
    }
    return wallet;
  }

  private buildWhere(filters: MovementFilters): {
    clause: string;
    params: string[];
  } {
    const conditions: string[] = [];
    const params: string[] = [];
    const add = (sql: (index: number) => string, value: string) => {
      params.push(value);
      conditions.push(sql(params.length));
    };

    if (filters.walletId === 'none') {
      conditions.push(`"walletId" IS NULL`);
    } else if (filters.walletId) {
      add((i) => `"walletId" = $${i}`, filters.walletId);
    }
    if (filters.type) add((i) => `type = $${i}`, filters.type);
    if (filters.from) add((i) => `date >= $${i}`, filters.from);
    if (filters.to) add((i) => `date <= $${i}`, filters.to);
    if (filters.search) {
      add((i) => `label ILIKE $${i}`, `%${filters.search}%`);
    }

    return {
      clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private toMovement(row: MovementRow, withRunningBalance: boolean): Movement {
    return {
      id: row.id,
      date: row.date,
      type: row.type,
      label: row.label,
      wallet: row.walletId
        ? {
            id: row.walletId,
            name: row.walletName ?? '',
            color: row.walletColor ?? '',
          }
        : null,
      amount: Number(row.amount),
      orderId: row.orderId,
      expenseId: row.expenseId,
      runningBalance:
        withRunningBalance && row.running !== null ? Number(row.running) : null,
    };
  }
}
