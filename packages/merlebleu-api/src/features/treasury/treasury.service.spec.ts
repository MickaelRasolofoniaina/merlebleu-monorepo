import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from '@merlebleu/shared';
import { OrderEntity } from '../sale/order/order.entity';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import {
  CashCountEntity,
  OrderRefundEntity,
  WalletTransferEntity,
} from './treasury.entity';
import { TreasuryService } from './treasury.service';

/* eslint-disable @typescript-eslint/no-unsafe-return */
// Loosely typed mocks: the repositories are replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

const createRepositoryMock = () => ({
  find: mockFn(),
  findOneBy: mockFn(),
  create: jest.fn((value: any) => value),
  save: jest.fn((value: any) => Promise.resolve(value)),
  createQueryBuilder: mockFn(),
});

const wallet = (overrides: Partial<PaymentMethodEntity> = {}) =>
  ({
    id: 'wallet-1',
    name: 'Espèces',
    color: '#16a34a',
    archived: false,
    ...overrides,
  }) as PaymentMethodEntity;

const cancelledOrder = (overrides: Partial<OrderEntity> = {}) =>
  ({
    id: 'order-1',
    orderStatus: OrderStatus.CANCELLED,
    paidAmount: 60000,
    balancePaidAmount: 0,
    ...overrides,
  }) as OrderEntity;

describe('TreasuryService', () => {
  let service: TreasuryService;
  let walletRepository: ReturnType<typeof createRepositoryMock>;
  let transferRepository: ReturnType<typeof createRepositoryMock>;
  let refundRepository: ReturnType<typeof createRepositoryMock>;
  let cashCountRepository: ReturnType<typeof createRepositoryMock>;
  let orderRepository: ReturnType<typeof createRepositoryMock>;
  let dataSource: { query: ReturnType<typeof mockFn> };

  const alreadyRefunded = (total: number) =>
    refundRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(() => Promise.resolve({ total: String(total) })),
    });

  beforeEach(async () => {
    walletRepository = createRepositoryMock();
    transferRepository = createRepositoryMock();
    refundRepository = createRepositoryMock();
    cashCountRepository = createRepositoryMock();
    orderRepository = createRepositoryMock();
    dataSource = { query: mockFn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: getDataSourceToken(), useValue: dataSource },
        {
          provide: getRepositoryToken(PaymentMethodEntity),
          useValue: walletRepository,
        },
        {
          provide: getRepositoryToken(WalletTransferEntity),
          useValue: transferRepository,
        },
        {
          provide: getRepositoryToken(OrderRefundEntity),
          useValue: refundRepository,
        },
        {
          provide: getRepositoryToken(CashCountEntity),
          useValue: cashCountRepository,
        },
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepository },
      ],
    }).compile();

    service = module.get(TreasuryService);
  });

  describe('createRefund', () => {
    const dto = {
      orderId: 'order-1',
      walletId: 'wallet-1',
      amount: 60000,
      date: '2026-11-26',
    };

    it('refunds the deposit of a cancelled order', async () => {
      orderRepository.findOneBy.mockResolvedValue(cancelledOrder());
      walletRepository.findOneBy.mockResolvedValue(wallet());
      alreadyRefunded(0);

      await service.createRefund(dto);

      expect(refundRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 60000, date: '2026-11-26' }),
      );
    });

    it('refuses an order that is not cancelled', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        cancelledOrder({ orderStatus: OrderStatus.TODO }),
      );

      await expect(service.createRefund(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(refundRepository.save).not.toHaveBeenCalled();
    });

    it('refuses an amount above what is still refundable', async () => {
      orderRepository.findOneBy.mockResolvedValue(cancelledOrder());
      walletRepository.findOneBy.mockResolvedValue(wallet());
      alreadyRefunded(30000);

      await expect(service.createRefund(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('does not count the balance collected at delivery as a deposit', async () => {
      orderRepository.findOneBy.mockResolvedValue(
        cancelledOrder({ paidAmount: 100000, balancePaidAmount: 70000 }),
      );
      walletRepository.findOneBy.mockResolvedValue(wallet());
      alreadyRefunded(0);

      await expect(service.createRefund(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('fails when the order does not exist', async () => {
      orderRepository.findOneBy.mockResolvedValue(null);

      await expect(service.createRefund(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createTransfer', () => {
    const dto = {
      fromWalletId: 'wallet-1',
      toWalletId: 'wallet-2',
      amount: 500000,
      date: '2026-11-26',
    };

    it('records a transfer between two active wallets', async () => {
      walletRepository.findOneBy
        .mockResolvedValueOnce(wallet({ id: 'wallet-1' }))
        .mockResolvedValueOnce(wallet({ id: 'wallet-2', name: 'Banque' }));

      await service.createTransfer(dto);

      expect(transferRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500000, note: null }),
      );
    });

    it('refuses an archived wallet', async () => {
      walletRepository.findOneBy
        .mockResolvedValueOnce(wallet({ id: 'wallet-1' }))
        .mockResolvedValueOnce(wallet({ id: 'wallet-2', archived: true }));

      await expect(service.createTransfer(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(transferRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createCashCount', () => {
    it('keeps the gap between the counted and the computed balance', async () => {
      walletRepository.findOneBy.mockResolvedValue(wallet());
      dataSource.query.mockResolvedValue([{ balance: '1245000' }]);

      const count = await service.createCashCount({
        walletId: 'wallet-1',
        date: '2026-11-26',
        countedAmount: 1238000,
      });

      expect(count.expectedAmount).toBe(1245000);
      expect(count.gap).toBe(-7000);
    });
  });

  describe('exportMovementsCsv', () => {
    it('writes a semicolon-separated file and escapes quotes and separators', async () => {
      dataSource.query.mockResolvedValue([
        {
          date: '2026-11-26',
          type: 'EXPENSE',
          label: 'Farine; "T55"',
          walletName: null,
          amount: -45000,
        },
      ]);

      const csv = await service.exportMovementsCsv({});
      const lines = csv.replace('﻿', '').split('\r\n');

      expect(lines[0]).toBe('Date;Type;Libellé;Portefeuille;Montant');
      expect(lines[1]).toBe(
        '2026-11-26;EXPENSE;"Farine; ""T55""";Non défini;-45000',
      );
    });
  });

  describe('listMovements', () => {
    it('adds the running balance only when one wallet is filtered', async () => {
      const row = {
        id: 'expense:1',
        date: '2026-11-26',
        type: 'EXPENSE',
        label: 'Farine',
        walletId: 'wallet-1',
        walletName: 'Espèces',
        walletColor: '#16a34a',
        amount: -45000,
        orderId: null,
        expenseId: '1',
        running: '1245000',
      };
      const totals = [{ total: '1', income: '0', outflow: '45000' }];

      dataSource.query
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce(totals)
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce(totals);

      const single = await service.listMovements({
        walletId: '00000000-0000-4000-8000-000000000001',
        page: 1,
        limit: 20,
      });
      const all = await service.listMovements({ page: 1, limit: 20 });

      expect(single.data[0].runningBalance).toBe(1245000);
      expect(all.data[0].runningBalance).toBeNull();
      expect(single.totals).toEqual({ income: 0, outflow: 45000 });
    });
  });
});
