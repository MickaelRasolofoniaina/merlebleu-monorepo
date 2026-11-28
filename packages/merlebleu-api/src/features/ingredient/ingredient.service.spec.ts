import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngredientSchema } from './ingredient.entity';
import { IngredientService } from './ingredient.service';
import { RecipeLineSchema } from './recipe/recipe.entity';
import { ProductionConsumptionSchema } from './production/production.entity';

// Loosely typed mocks: the repositories are replaced by plain objects
const mockFn = () => jest.fn<(...args: any[]) => any>();

describe('IngredientService.deleteIngredient', () => {
  let service: IngredientService;
  let repo: Record<string, ReturnType<typeof mockFn>>;
  let recipeLineRepo: Record<string, ReturnType<typeof mockFn>>;
  let consumptionRepo: Record<string, ReturnType<typeof mockFn>>;

  beforeEach(async () => {
    repo = { delete: mockFn().mockResolvedValue({ affected: 1 }) };
    recipeLineRepo = { count: mockFn().mockResolvedValue(0) };
    consumptionRepo = { count: mockFn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientService,
        { provide: getRepositoryToken(IngredientSchema), useValue: repo },
        {
          provide: getRepositoryToken(RecipeLineSchema),
          useValue: recipeLineRepo,
        },
        {
          provide: getRepositoryToken(ProductionConsumptionSchema),
          useValue: consumptionRepo,
        },
      ],
    }).compile();
    service = module.get(IngredientService);
  });

  it('refuses to delete an ingredient used by a recipe', async () => {
    recipeLineRepo.count.mockResolvedValue(1);

    await expect(service.deleteIngredient('flour')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete an ingredient already consumed by a production', async () => {
    consumptionRepo.count.mockResolvedValue(3);

    await expect(service.deleteIngredient('flour')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused ingredient', async () => {
    await service.deleteIngredient('flour');

    expect(repo.delete).toHaveBeenCalledWith('flour');
  });
});
