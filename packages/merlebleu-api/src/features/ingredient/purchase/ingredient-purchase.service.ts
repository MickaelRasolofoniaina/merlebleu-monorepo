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

@Injectable()
export class IngredientPurchaseService {
  constructor(
    @InjectRepository(IngredientPurchaseSchema)
    private readonly repo: Repository<IngredientPurchaseEntity>,
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

  addPurchase(
    dto: CreateIngredientPurchaseDto,
  ): Promise<IngredientPurchaseEntity> {
    const entity = this.repo.create({
      purchaseDate: dto.purchaseDate,
      quantity: dto.quantity,
      ingredient: { id: dto.ingredientId },
    });
    return this.repo.save(entity);
  }

  async updatePurchase(
    id: string,
    dto: UpdateIngredientPurchaseDto,
  ): Promise<IngredientPurchaseEntity> {
    await this.repo.update(id, {
      purchaseDate: dto.purchaseDate,
      quantity: dto.quantity,
      ingredient: { id: dto.ingredientId },
    });
    const updated = await this.repo.findOneBy({ id });
    if (!updated)
      throw new NotFoundException(`Achat avec l'id ${id} introuvable`);
    return updated;
  }

  async deletePurchase(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected)
      throw new NotFoundException(`Achat avec l'id ${id} introuvable`);
  }
}
