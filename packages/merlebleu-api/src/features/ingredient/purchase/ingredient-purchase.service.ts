import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import {
  IngredientPurchaseEntity,
  IngredientPurchaseSchema,
} from './ingredient-purchase.entity';
import {
  CreateIngredientPurchaseDto,
  UpdateIngredientPurchaseDto,
} from './ingredient-purchase.dto';
import { IngredientEntity, IngredientSchema } from '../ingredient.entity';

@Injectable()
export class IngredientPurchaseService {
  constructor(
    @InjectRepository(IngredientPurchaseSchema)
    private readonly repo: Repository<IngredientPurchaseEntity>,
    @InjectRepository(IngredientSchema)
    private readonly ingredientRepo: Repository<IngredientEntity>,
  ) {}

  async findPurchases(
    page = 1,
    limit = 20,
    filters?: {
      purchaseDate?: string;
      labelContains?: string;
      categoryId?: string;
    },
  ): Promise<ResultPaged<IngredientPurchaseEntity>> {
    const pagination = getPaginationParams({ page, limit });
    const where: FindOptionsWhere<IngredientPurchaseEntity> = {};

    if (filters?.purchaseDate) {
      where.purchaseDate = new Date(filters.purchaseDate) as unknown as Date;
    }
    if (filters?.labelContains && filters?.categoryId) {
      where.ingredient = {
        label: ILike(`%${filters.labelContains}%`),
        category: { id: filters.categoryId },
      };
    } else if (filters?.labelContains) {
      where.ingredient = { label: ILike(`%${filters.labelContains}%`) };
    } else if (filters?.categoryId) {
      where.ingredient = { category: { id: filters.categoryId } };
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { purchaseDate: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async addPurchase(
    dto: CreateIngredientPurchaseDto,
  ): Promise<IngredientPurchaseEntity> {
    const entity = this.repo.create({
      purchaseDate: dto.purchaseDate,
      quantity: dto.quantity,
      ingredient: { id: dto.ingredientId },
    });
    const saved = await this.repo.save(entity);
    await this.ingredientRepo.increment({ id: dto.ingredientId }, 'stock', dto.quantity);
    return saved;
  }

  async updatePurchase(
    id: string,
    dto: UpdateIngredientPurchaseDto,
  ): Promise<IngredientPurchaseEntity> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing)
      throw new NotFoundException(`Achat avec l'id ${id} introuvable`);

    const oldIngredientId = existing.ingredient.id;
    const newIngredientId = dto.ingredientId;

    await this.repo.update(id, {
      purchaseDate: dto.purchaseDate,
      quantity: dto.quantity,
      ingredient: { id: newIngredientId },
    });

    if (oldIngredientId !== newIngredientId) {
      await this.ingredientRepo.increment({ id: oldIngredientId }, 'stock', -Number(existing.quantity));
      await this.ingredientRepo.increment({ id: newIngredientId }, 'stock', dto.quantity);
    } else {
      const delta = dto.quantity - Number(existing.quantity);
      if (delta !== 0) {
        await this.ingredientRepo.increment({ id: newIngredientId }, 'stock', delta);
      }
    }

    const updated = await this.repo.findOneBy({ id });
    return updated!;
  }

  async deletePurchase(id: string): Promise<void> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing)
      throw new NotFoundException(`Achat avec l'id ${id} introuvable`);
    await this.repo.delete(id);
    await this.ingredientRepo.increment({ id: existing.ingredient.id }, 'stock', -Number(existing.quantity));
  }
}
