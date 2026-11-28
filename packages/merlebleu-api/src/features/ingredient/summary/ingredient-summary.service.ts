import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngredientMonthSummary } from '@merlebleu/shared';
import { IngredientEntity, IngredientSchema } from '../ingredient.entity';

type TotalRow = { id: string; total: string };

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const ENTRIES_SQL = `
  SELECT "ingredientId" AS id, SUM(quantity) AS total
  FROM stock_entries
  WHERE "entryDate" >= $1 AND "entryDate" < $2
  GROUP BY "ingredientId"`;

const CONSUMED_SQL = `
  SELECT pc."ingredientId" AS id, SUM(pc.quantity) AS total
  FROM production_consumptions pc
  JOIN productions p ON p.id = pc."productionId"
  WHERE p."productionDate" >= $1 AND p."productionDate" < $2
  GROUP BY pc."ingredientId"`;

@Injectable()
export class IngredientSummaryService {
  constructor(
    @InjectRepository(IngredientSchema)
    private readonly repo: Repository<IngredientEntity>,
  ) {}

  async getMonthSummary(month: string): Promise<IngredientMonthSummary[]> {
    const match = MONTH_PATTERN.exec(month);
    if (!match)
      throw new BadRequestException('Le mois doit être au format AAAA-MM');
    const year = Number(match[1]);
    const monthIndex = Number(match[2]);
    const from = `${match[1]}-${match[2]}-01`;
    const next =
      monthIndex === 12
        ? `${year + 1}-01-01`
        : `${match[1]}-${String(monthIndex + 1).padStart(2, '0')}-01`;

    const [ingredients, entries, consumed] = await Promise.all([
      this.repo.find({ order: { label: 'ASC' } }),
      this.repo.query<TotalRow[]>(ENTRIES_SQL, [from, next]),
      this.repo.query<TotalRow[]>(CONSUMED_SQL, [from, next]),
    ]);
    const toMap = (rows: TotalRow[]) =>
      new Map(rows.map((row) => [row.id, Number(row.total)]));
    const entriesById = toMap(entries);
    const consumedById = toMap(consumed);

    return ingredients.map((ingredient) => ({
      ingredient,
      entries: entriesById.get(ingredient.id) ?? 0,
      consumed: consumedById.get(ingredient.id) ?? 0,
      currentStock: Number(ingredient.stock),
    }));
  }
}
