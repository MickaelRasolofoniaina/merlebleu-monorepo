import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ProductionDayResult } from '@merlebleu/shared';
import { IngredientSchema } from '../ingredient.entity';
import { RecipeSchema } from '../recipe/recipe.entity';
import { ProductionEntity, ProductionSchema } from './production.entity';
import { SaveProductionDayDto } from './production.dto';

/** Rounds to 2 decimals, the scale of the stock and consumption columns. */
export const roundQuantity = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionSchema)
    private readonly repo: Repository<ProductionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findByDate(productionDate: string): Promise<ProductionEntity[]> {
    return this.repo.find({
      where: { productionDate },
      order: { recipe: { name: 'ASC' } },
    });
  }

  /**
   * Replaces every production of a day. The stock consumed by the previous
   * productions is given back, then the stock consumed by the new ones is
   * withdrawn, all in one transaction. The consumed quantities are frozen on
   * each production, so a later change of a recipe never alters the history.
   */
  saveDay(dto: SaveProductionDayDto): Promise<ProductionDayResult> {
    return this.dataSource.transaction(async (manager) => {
      const previous = await manager.find(ProductionSchema, {
        where: { productionDate: dto.productionDate },
      });
      const previousRecipeIds = new Set(previous.map((p) => p.recipe.id));
      const touchedIngredientIds = new Set<string>();

      for (const production of previous) {
        for (const consumption of production.consumptions) {
          touchedIngredientIds.add(consumption.ingredient.id);
          await manager.increment(
            IngredientSchema,
            { id: consumption.ingredient.id },
            'stock',
            consumption.quantity,
          );
        }
      }
      if (previous.length) {
        await manager.delete(
          ProductionSchema,
          previous.map((p) => p.id),
        );
      }

      const recipes = await this.loadRecipes(manager, dto, previousRecipeIds);

      for (const line of dto.lines) {
        const recipe = recipes.get(line.recipeId)!;
        const consumptions = recipe.lines.map((recipeLine) => ({
          quantity: roundQuantity(recipeLine.quantity * line.quantity),
          ingredient: { id: recipeLine.ingredient.id },
        }));
        await manager.save(ProductionSchema, {
          productionDate: dto.productionDate,
          quantity: line.quantity,
          recipe: { id: recipe.id },
          consumptions,
        });
        for (const consumption of consumptions) {
          touchedIngredientIds.add(consumption.ingredient.id);
          await manager.increment(
            IngredientSchema,
            { id: consumption.ingredient.id },
            'stock',
            -consumption.quantity,
          );
        }
      }

      return {
        productions: await manager.find(ProductionSchema, {
          where: { productionDate: dto.productionDate },
          order: { recipe: { name: 'ASC' } },
        }),
        shortages: await this.findShortages(manager, touchedIngredientIds),
      };
    });
  }

  private async loadRecipes(
    manager: EntityManager,
    dto: SaveProductionDayDto,
    previousRecipeIds: Set<string>,
  ) {
    const ids = dto.lines.map((line) => line.recipeId);
    const found = ids.length
      ? await manager.find(RecipeSchema, { where: { id: In(ids) } })
      : [];
    const recipes = new Map(found.map((recipe) => [recipe.id, recipe]));
    for (const id of ids) {
      const recipe = recipes.get(id);
      if (!recipe) throw new NotFoundException(`Recette ${id} introuvable`);
      if (!recipe.isActive && !previousRecipeIds.has(id))
        throw new BadRequestException(
          `La recette « ${recipe.name} » est archivée`,
        );
    }
    return recipes;
  }

  private async findShortages(
    manager: EntityManager,
    ingredientIds: Set<string>,
  ) {
    if (!ingredientIds.size) return [];
    const ingredients = await manager.find(IngredientSchema, {
      where: { id: In([...ingredientIds]) },
      order: { label: 'ASC' },
    });
    return ingredients
      .filter((ingredient) => Number(ingredient.stock) < 0)
      .map((ingredient) => ({ ingredient, stock: Number(ingredient.stock) }));
  }
}
