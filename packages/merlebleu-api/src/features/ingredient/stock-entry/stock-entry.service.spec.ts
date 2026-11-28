import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IngredientSchema } from '../ingredient.entity';
import { StockEntrySchema } from './stock-entry.entity';
import { StockEntryService } from './stock-entry.service';

// Loosely typed mocks: the TypeORM manager is replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

const FLOUR = '11111111-1111-4111-8111-111111111111';
const SUGAR = '22222222-2222-4222-8222-222222222222';
const DATE = '2026-11-28T00:00:00.000Z';

describe('StockEntryService', () => {
  let service: StockEntryService;
  let manager: Record<string, ReturnType<typeof mockFn>>;
  let existingEntry: unknown;

  beforeEach(async () => {
    existingEntry = {
      id: 'e1',
      quantity: '10',
      ingredient: { id: FLOUR },
    };
    manager = {
      find: mockFn().mockResolvedValue([
        { id: FLOUR, label: 'Farine', entryUnit: null, entryUnitFactor: null },
        { id: SUGAR, label: 'Sucre', entryUnit: null, entryUnitFactor: null },
      ]),
      existsBy: mockFn().mockResolvedValue(true),
      save: mockFn().mockImplementation((_schema, value) =>
        Promise.resolve({ id: 'new', ...value }),
      ),
      increment: mockFn().mockResolvedValue({ affected: 1 }),
      findOneBy: mockFn().mockImplementation(() =>
        Promise.resolve(existingEntry),
      ),
      findOneByOrFail: mockFn().mockResolvedValue({ id: 'e1' }),
      update: mockFn().mockResolvedValue({ affected: 1 }),
      delete: mockFn().mockResolvedValue({ affected: 1 }),
    };
    const dataSource = {
      transaction: (work: (m: unknown) => unknown) => work(manager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockEntryService,
        { provide: getRepositoryToken(StockEntrySchema), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(StockEntryService);
  });

  describe('addStockEntries', () => {
    it('saves every line and adds each quantity to its ingredient stock', async () => {
      const saved = await service.addStockEntries({
        entryDate: DATE,
        lines: [
          { ingredientId: FLOUR, quantity: 25 },
          { ingredientId: SUGAR, quantity: 4.5 },
        ],
      });

      expect(saved).toHaveLength(2);
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        25,
      );
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: SUGAR },
        'stock',
        4.5,
      );
    });

    it('converts a quantity typed in the entry unit and keeps the factor', async () => {
      manager.find.mockResolvedValue([
        {
          id: FLOUR,
          label: 'Farine',
          entryUnit: { id: 'u-bag', label: 'sac' },
          entryUnitFactor: 50000,
        },
      ]);

      await service.addStockEntries({
        entryDate: DATE,
        lines: [{ ingredientId: FLOUR, quantity: 3, unit: 'entry' }],
      });

      expect(manager.save).toHaveBeenCalledWith(
        StockEntrySchema,
        expect.objectContaining({
          quantity: 150000,
          enteredQuantity: 3,
          enteredUnitLabel: 'sac',
          conversionFactor: 50000,
        }),
      );
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        150000,
      );
    });

    it('keeps the typed quantity as is when the stock unit is chosen', async () => {
      manager.find.mockResolvedValue([
        {
          id: FLOUR,
          label: 'Farine',
          entryUnit: { id: 'u-bag', label: 'sac' },
          entryUnitFactor: 50000,
        },
      ]);

      await service.addStockEntries({
        entryDate: DATE,
        lines: [{ ingredientId: FLOUR, quantity: 2500, unit: 'stock' }],
      });

      expect(manager.save).toHaveBeenCalledWith(
        StockEntrySchema,
        expect.objectContaining({
          quantity: 2500,
          enteredQuantity: null,
          conversionFactor: null,
        }),
      );
    });

    it('rounds the converted quantity to 2 decimals', async () => {
      manager.find.mockResolvedValue([
        {
          id: FLOUR,
          label: 'Farine',
          entryUnit: { id: 'u-box', label: 'boîte' },
          entryUnitFactor: 0.333,
        },
      ]);

      await service.addStockEntries({
        entryDate: DATE,
        lines: [{ ingredientId: FLOUR, quantity: 1, unit: 'entry' }],
      });

      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        0.33,
      );
    });

    it('refuses the entry unit when the ingredient has none, and writes nothing', async () => {
      await expect(
        service.addStockEntries({
          entryDate: DATE,
          lines: [
            { ingredientId: FLOUR, quantity: 25 },
            { ingredientId: SUGAR, quantity: 1, unit: 'entry' },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.increment).not.toHaveBeenCalledWith(
        IngredientSchema,
        { id: SUGAR },
        'stock',
        expect.anything(),
      );
    });

    it('writes nothing when an ingredient is unknown', async () => {
      manager.find.mockResolvedValue([{ id: FLOUR }]);

      await expect(
        service.addStockEntries({
          entryDate: DATE,
          lines: [
            { ingredientId: FLOUR, quantity: 25 },
            { ingredientId: SUGAR, quantity: 4 },
          ],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.increment).not.toHaveBeenCalled();
    });
  });

  describe('updateStockEntry', () => {
    it('applies only the quantity difference on the same ingredient', async () => {
      await service.updateStockEntry('e1', {
        entryDate: DATE,
        ingredientId: FLOUR,
        quantity: 12,
      });

      expect(manager.increment).toHaveBeenCalledTimes(1);
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        2,
      );
    });

    it('moves the quantity from the old to the new ingredient', async () => {
      await service.updateStockEntry('e1', {
        entryDate: DATE,
        ingredientId: SUGAR,
        quantity: 8,
      });

      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        -10,
      );
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: SUGAR },
        'stock',
        8,
      );
    });

    it('applies the original factor when an entry typed in bags is corrected', async () => {
      existingEntry = {
        id: 'e1',
        quantity: 150000,
        enteredQuantity: 3,
        enteredUnitLabel: 'sac',
        conversionFactor: 50000,
        ingredient: { id: FLOUR },
      };

      await service.updateStockEntry('e1', {
        entryDate: DATE,
        ingredientId: FLOUR,
        quantity: 4,
      });

      expect(manager.update).toHaveBeenCalledWith(
        StockEntrySchema,
        'e1',
        expect.objectContaining({
          quantity: 200000,
          enteredQuantity: 4,
          enteredUnitLabel: 'sac',
          conversionFactor: 50000,
        }),
      );
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        50000,
      );
    });

    it('drops the conversion when the entry is moved to another ingredient', async () => {
      existingEntry = {
        id: 'e1',
        quantity: 150000,
        enteredQuantity: 3,
        enteredUnitLabel: 'sac',
        conversionFactor: 50000,
        ingredient: { id: FLOUR },
      };

      await service.updateStockEntry('e1', {
        entryDate: DATE,
        ingredientId: SUGAR,
        quantity: 8,
      });

      expect(manager.update).toHaveBeenCalledWith(
        StockEntrySchema,
        'e1',
        expect.objectContaining({
          quantity: 8,
          enteredQuantity: null,
          conversionFactor: null,
        }),
      );
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        -150000,
      );
    });

    it('throws when the entry does not exist', async () => {
      existingEntry = null;

      await expect(
        service.updateStockEntry('missing', {
          entryDate: DATE,
          ingredientId: FLOUR,
          quantity: 1,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteStockEntry', () => {
    it('removes the entry and withdraws its quantity from the stock', async () => {
      await service.deleteStockEntry('e1');

      expect(manager.delete).toHaveBeenCalledWith(StockEntrySchema, 'e1');
      expect(manager.increment).toHaveBeenCalledWith(
        IngredientSchema,
        { id: FLOUR },
        'stock',
        -10,
      );
    });

    it('throws when the entry does not exist', async () => {
      existingEntry = null;

      await expect(service.deleteStockEntry('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.increment).not.toHaveBeenCalled();
    });
  });
});
