import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IngredientSchema } from '../ingredient.entity';
import { RecipeLineSchema, RecipeSchema } from './recipe.entity';
import { RecipeService } from './recipe.service';

// Loosely typed mocks: the TypeORM manager is replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

const stored = {
  id: 'r1',
  name: 'Biscuit nature',
  isActive: true,
  lines: [
    { id: 'l1', quantity: 1250, ingredient: { id: 'flour' } },
    { id: 'l2', quantity: 36, ingredient: { id: 'egg' } },
  ],
};

describe('RecipeService', () => {
  let service: RecipeService;
  let repo: Record<string, ReturnType<typeof mockFn>>;
  let manager: Record<string, ReturnType<typeof mockFn>>;

  beforeEach(async () => {
    repo = {
      update: mockFn().mockResolvedValue({ affected: 1 }),
      findOneBy: mockFn().mockResolvedValue({ ...stored, isActive: false }),
    };
    manager = {
      findOne: mockFn().mockResolvedValue(stored),
      count: mockFn().mockResolvedValue(2),
      save: mockFn().mockResolvedValue({ id: 'r2' }),
      delete: mockFn().mockResolvedValue({ affected: 2 }),
    };
    const dataSource = {
      transaction: (work: (m: unknown) => unknown) => work(manager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        { provide: getRepositoryToken(RecipeSchema), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(RecipeService);
  });

  it('rejects a recipe that references an unknown ingredient', async () => {
    manager.count.mockResolvedValue(1);

    await expect(
      service.addRecipe({
        name: 'Biscuit',
        lines: [
          { ingredientId: 'flour', quantity: 1250 },
          { ingredientId: 'ghost', quantity: 10 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('replaces the lines of a recipe on update', async () => {
    manager.count.mockResolvedValue(1);

    await service.updateRecipe('r1', {
      name: 'Biscuit nature',
      lines: [{ ingredientId: 'flour', quantity: 1300 }],
    });

    expect(manager.count).toHaveBeenCalledWith(IngredientSchema, {
      where: { id: expect.anything() },
    });
    expect(manager.delete).toHaveBeenCalledWith(RecipeLineSchema, {
      recipe: { id: 'r1' },
    });
    expect(manager.save).toHaveBeenCalledWith(RecipeSchema, {
      id: 'r1',
      name: 'Biscuit nature',
      lines: [{ quantity: 1300, ingredient: { id: 'flour' } }],
    });
  });

  it('duplicates a recipe with the same doses and a copy suffix', async () => {
    await service.duplicateRecipe('r1');

    expect(manager.save).toHaveBeenCalledWith(RecipeSchema, {
      name: 'Biscuit nature (copie)',
      isActive: true,
      lines: [
        { quantity: 1250, ingredient: { id: 'flour' } },
        { quantity: 36, ingredient: { id: 'egg' } },
      ],
    });
  });

  it('archives and restores a recipe instead of deleting it', async () => {
    await service.setActive('r1', false);

    expect(repo.update).toHaveBeenCalledWith('r1', { isActive: false });
  });

  it('throws when archiving an unknown recipe', async () => {
    repo.update.mockResolvedValue({ affected: 0 });

    await expect(service.setActive('missing', false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
