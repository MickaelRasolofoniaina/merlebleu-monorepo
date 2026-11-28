import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { IngredientEntity, IngredientSchema } from './ingredient.entity';
import { RecipeLineEntity, RecipeLineSchema } from './recipe/recipe.entity';
import {
  ProductionConsumptionEntity,
  ProductionConsumptionSchema,
} from './production/production.entity';
import {
  CreateIngredientDto,
  UpdateIngredientDto,
  UpdateIngredientStockDto,
} from './ingredient.dto';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(IngredientSchema)
    private readonly repo: Repository<IngredientEntity>,
    @InjectRepository(RecipeLineSchema)
    private readonly recipeLineRepo: Repository<RecipeLineEntity>,
    @InjectRepository(ProductionConsumptionSchema)
    private readonly consumptionRepo: Repository<ProductionConsumptionEntity>,
  ) {}

  async findIngredients(
    page = 1,
    limit = 20,
    filters?: { labelContains?: string; unitId?: string },
  ): Promise<ResultPaged<IngredientEntity>> {
    const pagination = getPaginationParams({ page, limit });
    const where: FindOptionsWhere<IngredientEntity> = {};
    if (filters?.labelContains)
      where.label = ILike(`%${filters.labelContains}%`);
    if (filters?.unitId) where.unit = { id: filters.unitId };

    const [data, total] = await this.repo.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { label: 'ASC' },
    });
    return { data, total, page, limit };
  }

  addIngredient(dto: CreateIngredientDto): Promise<IngredientEntity> {
    const entity = this.repo.create({
      label: dto.label,
      unit: { id: dto.unitId },
      entryUnit: dto.entryUnitId ? { id: dto.entryUnitId } : null,
      entryUnitFactor: dto.entryUnitId ? (dto.entryUnitFactor ?? null) : null,
      defaultPaymentMethod: dto.defaultPaymentMethodId
        ? { id: dto.defaultPaymentMethodId }
        : null,
    });
    return this.repo.save(entity);
  }

  async updateIngredient(
    id: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientEntity> {
    await this.repo.update(id, {
      label: dto.label,
      unit: { id: dto.unitId },
      ...(dto.entryUnitId !== undefined && {
        entryUnit: dto.entryUnitId ? { id: dto.entryUnitId } : null,
        entryUnitFactor: dto.entryUnitId ? (dto.entryUnitFactor ?? null) : null,
      }),
      ...(dto.defaultPaymentMethodId !== undefined && {
        defaultPaymentMethod: dto.defaultPaymentMethodId
          ? { id: dto.defaultPaymentMethodId }
          : null,
      }),
    });
    const updated = await this.repo.findOneBy({ id });
    if (!updated)
      throw new NotFoundException(`Ingrédient avec l'id ${id} introuvable`);
    return updated;
  }

  async deleteIngredient(id: string): Promise<void> {
    const [inRecipes, inProductions] = await Promise.all([
      this.recipeLineRepo.count({ where: { ingredient: { id } } }),
      this.consumptionRepo.count({ where: { ingredient: { id } } }),
    ]);
    if (inRecipes > 0)
      throw new ConflictException(
        'Cet ingrédient est utilisé dans une recette, retirez-le de la recette avant de le supprimer',
      );
    if (inProductions > 0)
      throw new ConflictException(
        'Cet ingrédient a déjà été consommé par une production, il ne peut plus être supprimé',
      );
    const result = await this.repo.delete(id);
    if (!result.affected)
      throw new NotFoundException(`Ingrédient avec l'id ${id} introuvable`);
  }

  async updateIngredientStock(
    id: string,
    dto: UpdateIngredientStockDto,
  ): Promise<IngredientEntity> {
    await this.repo.update(id, { stock: dto.stock });
    const updated = await this.repo.findOneBy({ id });
    if (!updated)
      throw new NotFoundException(`Ingrédient avec l'id ${id} introuvable`);
    return updated;
  }
}
