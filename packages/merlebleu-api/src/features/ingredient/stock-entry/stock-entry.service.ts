import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { StockEntryEntity, StockEntrySchema } from './stock-entry.entity';
import { CreateStockEntriesDto, UpdateStockEntryDto } from './stock-entry.dto';
import { IngredientEntity, IngredientSchema } from '../ingredient.entity';

type EntryAmounts = Pick<
  StockEntryEntity,
  'quantity' | 'enteredQuantity' | 'enteredUnitLabel' | 'conversionFactor'
>;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Converts the typed quantity into the stock unit. The factor and the unit label are kept on the
 * entry so that later changes of the ingredient formula never alter the history.
 */
function resolveAmounts(
  ingredient: IngredientEntity,
  quantity: number,
  unit: 'entry' | 'stock' | undefined,
): EntryAmounts {
  if (unit !== 'entry') {
    return {
      quantity,
      enteredQuantity: null,
      enteredUnitLabel: null,
      conversionFactor: null,
    };
  }
  const factor = Number(ingredient.entryUnitFactor);
  if (!ingredient.entryUnit || !(factor > 0)) {
    throw new BadRequestException(
      `L'ingrédient « ${ingredient.label} » n'a pas d'unité d'entrée`,
    );
  }
  return {
    quantity: round2(quantity * factor),
    enteredQuantity: quantity,
    enteredUnitLabel: ingredient.entryUnit.label,
    conversionFactor: factor,
  };
}

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
      const ingredients = await manager.find(IngredientSchema, {
        where: { id: In(ids) },
      });
      if (ingredients.length !== ids.length)
        throw new NotFoundException(
          'Au moins un ingrédient de la saisie est introuvable',
        );
      const byId = new Map(
        ingredients.map((ingredient) => [ingredient.id, ingredient]),
      );

      const entryDate = new Date(dto.entryDate);
      const saved: StockEntryEntity[] = [];
      for (const line of dto.lines) {
        const amounts = resolveAmounts(
          byId.get(line.ingredientId)!,
          line.quantity,
          line.unit,
        );
        saved.push(
          await manager.save(StockEntrySchema, {
            entryDate,
            ...amounts,
            ingredient: { id: line.ingredientId },
          } as StockEntryEntity),
        );
        await manager.increment(
          IngredientSchema,
          { id: line.ingredientId },
          'stock',
          amounts.quantity,
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
      // The typed quantity keeps the factor of the entry; moving it to another ingredient drops the conversion
      const factor =
        oldIngredientId === newIngredientId && existing.conversionFactor
          ? Number(existing.conversionFactor)
          : null;
      const quantity = factor ? round2(dto.quantity * factor) : dto.quantity;
      await manager.update(StockEntrySchema, id, {
        entryDate: new Date(dto.entryDate),
        quantity,
        enteredQuantity: factor ? dto.quantity : null,
        enteredUnitLabel: factor ? existing.enteredUnitLabel : null,
        conversionFactor: factor,
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
          quantity,
        );
      } else {
        const delta = round2(quantity - Number(existing.quantity));
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
