import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseSection } from '@merlebleu/shared';
import { ExpenseEntity } from '../expense.entity';
import { ExpenseCategoryEntity } from './expense-category.entity';
import { ExpenseCategoryService } from './expense-category.service';

/* eslint-disable @typescript-eslint/no-unsafe-return */
// Loosely typed mocks: the repositories are replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

describe('ExpenseCategoryService', () => {
  let service: ExpenseCategoryService;
  const getOne = mockFn();
  const categoryRepository = {
    find: mockFn(),
    findOneBy: mockFn(),
    create: jest.fn((value: any) => value),
    save: jest.fn((value: any) => Promise.resolve(value)),
    delete: mockFn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => ({
      where: mockFn().mockReturnThis(),
      andWhere: mockFn().mockReturnThis(),
      getOne,
    })),
  };
  const expenseRepository = { count: mockFn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseCategoryService,
        {
          provide: getRepositoryToken(ExpenseCategoryEntity),
          useValue: categoryRepository,
        },
        {
          provide: getRepositoryToken(ExpenseEntity),
          useValue: expenseRepository,
        },
      ],
    }).compile();
    service = module.get(ExpenseCategoryService);
  });

  it('rejects a duplicated label within the same section', async () => {
    getOne.mockResolvedValue({ id: 'other' });

    await expect(
      service.add({ label: 'Gaz', section: ExpenseSection.CURRENT }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to delete a category used by expenses', async () => {
    expenseRepository.count.mockResolvedValue(3);

    await expect(service.delete('category-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused category', async () => {
    expenseRepository.count.mockResolvedValue(0);

    await service.delete('category-1');

    expect(categoryRepository.delete).toHaveBeenCalledWith('category-1');
  });
});
