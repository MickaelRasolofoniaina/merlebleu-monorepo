import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { StockEntryEntity, StockEntrySchema } from './stock-entry.entity';
import { CreateStockEntriesDto, UpdateStockEntryDto } from './stock-entry.dto';
import { IngredientSchema } from '../ingredient.entity';

@Injectable()
export class StockEntryService {
  constructor(
    @InjectRepository(StockEntrySchema)
    private readonly repo: Repository<StockEntryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findStockEntries(
    page = 1,
    limit = 20,
    filters?: { entryDate?: string; labelContains?: string },
  ): Promise<ResultPaged<StockEntryEntity>> {
    const pagination = getPaginationParams({ page, limit });
    const where: FindOptionsWhere<StockEntryEntity> = {};

    if (filters?.entryDate) {
      where.entryDate = new Date(filters.entryDate) as unknown as Date;
    }
    if (filters?.labelContains) {
      where.ingredient = { label: ILike(`%${filters.labelContains}%`) };
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { entryDate: 'DESC' },
    });
    return { data, total, page, limit };
  }

  /** Saves every line and increments the stocks in one transaction: all or nothing. */
  addStockEntries(dto: CreateStockEntriesDto): Promise<StockEntryEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const ids = dto.lines.map((line) => line.ingredientId);
      const found = await manager.count(IngredientSchema, {
        where: { id: In(ids) },
      });
      if (found !== ids.length)
        throw new NotFoundException(
          'Au moins un ingrédient de la saisie est introuvable',
        );

      const entryDate = new Date(dto.entryDate);
      const saved: StockEntryEntity[] = [];
      for (const line of dto.lines) {
        saved.push(
          await manager.save(StockEntrySchema, {
            entryDate,
            quantity: line.quantity,
            ingredient: { id: line.ingredientId },
          } as StockEntryEntity),
        );
        await manager.increment(
          IngredientSchema,
          { id: line.ingredientId },
          'stock',
          line.quantity,
        );
      }
      return saved;
    });
  }

  updateStockEntry(
    id: string,
    dto: UpdateStockEntryDto,
  ): Promise<StockEntryEntity> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOneBy(StockEntrySchema, { id });
      if (!existing)
        throw new NotFoundException(`Entrée de stock ${id} introuvable`);
      const newIngredientId = dto.ingredientId;
      if (!(await manager.existsBy(IngredientSchema, { id: newIngredientId })))
        throw new NotFoundException(
          `Ingrédient avec l'id ${newIngredientId} introuvable`,
        );

      const oldIngredientId = existing.ingredient.id;
      await manager.update(StockEntrySchema, id, {
        entryDate: new Date(dto.entryDate),
        quantity: dto.quantity,
        ingredient: { id: newIngredientId },
      });

      if (oldIngredientId !== newIngredientId) {
        await manager.increment(
          IngredientSchema,
          { id: oldIngredientId },
          'stock',
          -Number(existing.quantity),
        );
        await manager.increment(
          IngredientSchema,
          { id: newIngredientId },
          'stock',
          dto.quantity,
        );
      } else {
        const delta = dto.quantity - Number(existing.quantity);
        if (delta !== 0) {
          await manager.increment(
            IngredientSchema,
            { id: newIngredientId },
            'stock',
            delta,
          );
        }
      }

      return manager.findOneByOrFail(StockEntrySchema, { id });
    });
  }

  deleteStockEntry(id: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOneBy(StockEntrySchema, { id });
      if (!existing)
        throw new NotFoundException(`Entrée de stock ${id} introuvable`);
      await manager.delete(StockEntrySchema, id);
      await manager.increment(
        IngredientSchema,
        { id: existing.ingredient.id },
        'stock',
        -Number(existing.quantity),
      );
    });
  }
}
