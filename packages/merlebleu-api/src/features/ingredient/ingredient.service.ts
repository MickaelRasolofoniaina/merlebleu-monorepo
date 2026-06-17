import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { IngredientEntity, IngredientSchema } from './ingredient.entity';
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
  ) {}

  async findIngredients(
    page = 1,
    limit = 20,
    filters?: { labelContains?: string; categoryId?: string; unitId?: string },
  ): Promise<ResultPaged<IngredientEntity>> {
    const pagination = getPaginationParams({ page, limit });
    const where: FindOptionsWhere<IngredientEntity> = {};
    if (filters?.labelContains)
      where.label = ILike(`%${filters.labelContains}%`);
    if (filters?.categoryId) where.category = { id: filters.categoryId };
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
      unitPrice: dto.unitPrice,
      category: { id: dto.categoryId },
      unit: { id: dto.unitId },
    });
    return this.repo.save(entity);
  }

  async updateIngredient(
    id: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientEntity> {
    await this.repo.update(id, {
      label: dto.label,
      unitPrice: dto.unitPrice,
      category: { id: dto.categoryId },
      unit: { id: dto.unitId },
    });
    const updated = await this.repo.findOneBy({ id });
    if (!updated)
      throw new NotFoundException(`Ingrédient avec l'id ${id} introuvable`);
    return updated;
  }

  async deleteIngredient(id: string): Promise<void> {
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
