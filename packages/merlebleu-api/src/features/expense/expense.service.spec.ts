import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseNature, FixedExpenseType } from '@merlebleu/shared';
import { IngredientEntity } from '../ingredient/ingredient.entity';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import { ExpenseCategoryEntity } from './category/expense-category.entity';
import { ExpenseEntity } from './expense.entity';
import { ExpenseService } from './expense.service';
import { PeriodLockService } from '../treasury/period-lock/period-lock.service';

/* eslint-disable @typescript-eslint/no-unsafe-return */
// Loosely typed mocks: the repositories are replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

type RepositoryMock = Record<string, ReturnType<typeof mockFn>>;

const createRepositoryMock = (): RepositoryMock => ({
  find: mockFn(),
  findOne: mockFn(),
  findOneBy: mockFn(),
  create: jest.fn((value: any) => value),
  save: jest.fn((value: any) => Promise.resolve(value)),
  delete: mockFn().mockResolvedValue({ affected: 1 }),
});

const fixedExpense = (overrides: Partial<ExpenseEntity>): ExpenseEntity =>
  ({
    id: 'id',
    nature: ExpenseNature.FIXED,
    date: '2026-01-31',
    amount: 1000,
    fixedType: FixedExpenseType.CHARGE,
    label: 'Jirama',
    detail: null,
    paid: true,
    paymentMethod: null,
    ...overrides,
  }) as ExpenseEntity;

describe('ExpenseService', () => {
  let service: ExpenseService;
  let expenseRepository: RepositoryMock;
  let categoryRepository: RepositoryMock;
  let periodLock: { assertOpen: ReturnType<typeof mockFn> };

  beforeEach(async () => {
    expenseRepository = createRepositoryMock();
    categoryRepository = createRepositoryMock();
    periodLock = { assertOpen: mockFn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(ExpenseEntity),
          useValue: expenseRepository,
        },
        {
          provide: getRepositoryToken(ExpenseCategoryEntity),
          useValue: categoryRepository,
        },
        {
          provide: getRepositoryToken(IngredientEntity),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(PaymentMethodEntity),
          useValue: {
            ...createRepositoryMock(),
            findOneBy: mockFn().mockResolvedValue({ id: 'wallet-1' }),
          },
        },
        { provide: PeriodLockService, useValue: periodLock },
      ],
    }).compile();

    service = module.get(ExpenseService);
  });

  describe('setCell', () => {
    const dto = { date: '2026-11-05', categoryId: 'category-1', amount: 1500 };

    it('creates a variable expense when the cell is empty', async () => {
      expenseRepository.findOne.mockResolvedValue(null);
      categoryRepository.findOneBy.mockResolvedValue({ id: 'category-1' });

      await service.setCell(dto);

      expect(expenseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nature: ExpenseNature.VARIABLE,
          date: '2026-11-05',
          amount: 1500,
          category: { id: 'category-1' },
        }),
      );
    });

    it('updates the amount when the cell already has an expense', async () => {
      const existing = { id: 'expense-1', amount: 100 };
      expenseRepository.findOne.mockResolvedValue(existing);

      await service.setCell(dto);

      expect(existing.amount).toBe(1500);
      expect(expenseRepository.save).toHaveBeenCalledWith(existing);
    });

    it('deletes the expense and returns null when the amount is 0', async () => {
      expenseRepository.findOne.mockResolvedValue({ id: 'expense-1' });

      const result = await service.setCell({ ...dto, amount: 0 });

      expect(result).toBeNull();
      expect(expenseRepository.delete).toHaveBeenCalledWith('expense-1');
    });
  });

  describe('closed periods', () => {
    const closed = new BadRequestException('période clôturée');

    it('refuses a cell dated in a closed period without touching the data', async () => {
      periodLock.assertOpen.mockRejectedValue(closed);

      await expect(
        service.setCell({ date: '2026-09-15', categoryId: 'c', amount: 100 }),
      ).rejects.toBe(closed);
      expect(expenseRepository.save).not.toHaveBeenCalled();
    });

    it('refuses to mark a fixed expense of a closed period as paid', async () => {
      expenseRepository.findOneBy.mockResolvedValue(
        fixedExpense({ date: '2026-09-30', paid: false }),
      );
      periodLock.assertOpen.mockRejectedValue(closed);

      await expect(service.setPaid('id', true)).rejects.toBe(closed);
      expect(periodLock.assertOpen).toHaveBeenCalledWith('2026-09-30');
      expect(expenseRepository.save).not.toHaveBeenCalled();
    });

    it('lets an unpaid fixed expense be edited, it is not in the ledger', async () => {
      expenseRepository.findOneBy.mockResolvedValue(
        fixedExpense({ date: '2026-09-30', paid: false }),
      );
      periodLock.assertOpen.mockRejectedValue(closed);

      await service.updateFixed('id', {
        date: '2026-09-30',
        fixedType: FixedExpenseType.CHARGE,
        label: 'Jirama',
        amount: 2000,
        paymentMethodId: 'wallet-1',
        paid: false,
      });

      expect(periodLock.assertOpen).not.toHaveBeenCalled();
      expect(expenseRepository.save).toHaveBeenCalled();
    });

    it('refuses to delete a paid expense of a closed period', async () => {
      expenseRepository.findOneBy.mockResolvedValue(
        fixedExpense({ date: '2026-09-30', paid: true }),
      );
      periodLock.assertOpen.mockRejectedValue(closed);

      await expect(service.delete('id')).rejects.toBe(closed);
      expect(expenseRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('copyFixedFromPreviousMonth', () => {
    it('copies unpaid lines into the target month and bounds the day', async () => {
      expenseRepository.find
        .mockResolvedValueOnce([fixedExpense({ date: '2026-01-31' })])
        .mockResolvedValueOnce([]);

      const copies = await service.copyFixedFromPreviousMonth({
        year: 2026,
        month: 2,
      });

      expect(copies).toHaveLength(1);
      expect(copies[0]).toEqual(
        expect.objectContaining({
          date: '2026-02-28',
          paid: false,
          label: 'Jirama',
        }),
      );
    });

    it('skips lines that already exist in the target month', async () => {
      expenseRepository.find
        .mockResolvedValueOnce([fixedExpense({ date: '2026-01-10' })])
        .mockResolvedValueOnce([fixedExpense({ date: '2026-02-12' })]);

      const copies = await service.copyFixedFromPreviousMonth({
        year: 2026,
        month: 2,
      });

      expect(copies).toEqual([]);
    });

    it('reads December of the previous year when copying into January', async () => {
      expenseRepository.find.mockResolvedValue([]);

      await service.copyFixedFromPreviousMonth({ year: 2026, month: 1 });

      const firstQuery = expenseRepository.find.mock.calls[0][0] as {
        where: { date: { _value: string[] } };
      };
      expect(firstQuery.where.date._value[0]).toBe('2025-12-01');
    });
  });
});
