import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IngredientSchema } from '../ingredient.entity';
import { RecipeSchema } from '../recipe/recipe.entity';
import { ProductionSchema } from './production.entity';
import { ProductionService, roundQuantity } from './production.service';

// Loosely typed mocks: the TypeORM manager is replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

const DAY = '2026-10-15';
const FLOUR = { id: 'flour', label: 'Farine', stock: '10000' };
const EGG = { id: 'egg', label: 'Oeufs', stock: '100' };

const recipe = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  name: 'Biscuit nature',
  isActive: true,
  lines: [
    { id: 'l1', quantity: 1250, ingredient: FLOUR },
    { id: 'l2', quantity: 36, ingredient: EGG },
  ],
  ...overrides,
});

describe('ProductionService', () => {
  let service: ProductionService;
  let manager: Record<string, ReturnType<typeof mockFn>>;
  let previous: unknown[];
  let recipes: unknown[];
  let ingredientsAfter: unknown[];

  beforeEach(async () => {
    previous = [];
    recipes = [recipe()];
    ingredientsAfter = [FLOUR, EGG];
    let productionReads = 0;

    manager = {
      find: mockFn().mockImplementation((schema: unknown) => {
        if (schema === ProductionSchema) {
          productionReads += 1;
          return Promise.resolve(productionReads === 1 ? previous : []);
        }
        if (schema === RecipeSchema) return Promise.resolve(recipes);
        if (schema === IngredientSchema)
          return Promise.resolve(ingredientsAfter);
        return Promise.resolve([]);
      }),
      save: mockFn().mockResolvedValue({}),
      delete: mockFn().mockResolvedValue({ affected: 1 }),
      increment: mockFn().mockResolvedValue({ affected: 1 }),
    };
    const dataSource = {
      transaction: (work: (m: unknown) => unknown) => work(manager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: getRepositoryToken(ProductionSchema), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(ProductionService);
  });

  it('freezes the consumption (dose x batches) and withdraws it from the stock', async () => {
    await service.saveDay({
      productionDate: DAY,
      lines: [{ recipeId: 'r1', quantity: 0.5 }],
    });

    expect(manager.save).toHaveBeenCalledWith(ProductionSchema, {
      productionDate: DAY,
      quantity: 0.5,
      recipe: { id: 'r1' },
      consumptions: [
        { quantity: 625, ingredient: { id: 'flour' } },
        { quantity: 18, ingredient: { id: 'egg' } },
      ],
    });
    expect(manager.increment).toHaveBeenCalledWith(
      IngredientSchema,
      { id: 'flour' },
      'stock',
      -625,
    );
    expect(manager.increment).toHaveBeenCalledWith(
      IngredientSchema,
      { id: 'egg' },
      'stock',
      -18,
    );
  });

  it('gives back the stock of the previous productions of the day before applying the new ones', async () => {
    previous = [
      {
        id: 'p-old',
        recipe: { id: 'r1' },
        consumptions: [{ id: 'c1', quantity: 1000, ingredient: FLOUR }],
      },
    ];

    await service.saveDay({ productionDate: DAY, lines: [] });

    expect(manager.increment).toHaveBeenCalledWith(
      IngredientSchema,
      { id: 'flour' },
      'stock',
      1000,
    );
    expect(manager.delete).toHaveBeenCalledWith(ProductionSchema, ['p-old']);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('allows a negative stock and reports the missing ingredients', async () => {
    ingredientsAfter = [FLOUR, { ...EGG, stock: '-44.00' }];

    const result = await service.saveDay({
      productionDate: DAY,
      lines: [{ recipeId: 'r1', quantity: 4 }],
    });

    expect(result.shortages).toEqual([
      { ingredient: { ...EGG, stock: '-44.00' }, stock: -44 },
    ]);
  });

  it('rejects an archived recipe that was not already produced that day', async () => {
    recipes = [recipe({ isActive: false })];

    await expect(
      service.saveDay({
        productionDate: DAY,
        lines: [{ recipeId: 'r1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps an archived recipe that was already produced that day', async () => {
    recipes = [recipe({ isActive: false })];
    previous = [{ id: 'p-old', recipe: { id: 'r1' }, consumptions: [] }];

    await expect(
      service.saveDay({
        productionDate: DAY,
        lines: [{ recipeId: 'r1', quantity: 1 }],
      }),
    ).resolves.toBeDefined();
  });

  it('rejects an unknown recipe', async () => {
    recipes = [];

    await expect(
      service.saveDay({
        productionDate: DAY,
        lines: [{ recipeId: 'missing', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rounds quantities to 2 decimals', () => {
    expect(roundQuantity(0.34 * 1175)).toBe(399.5);
    expect(roundQuantity(1.005 * 100)).toBe(100.5);
    expect(roundQuantity(0.75 * 4)).toBe(3);
  });
});
