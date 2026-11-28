import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { ResultPaged } from '@merlebleu/shared';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { IngredientSchema } from '../ingredient.entity';
import { RecipeEntity, RecipeLineSchema, RecipeSchema } from './recipe.entity';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(RecipeSchema)
    private readonly repo: Repository<RecipeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findRecipes(
    page = 1,
    limit = 20,
    filters?: { labelContains?: string; isActive?: boolean },
  ): Promise<ResultPaged<RecipeEntity>> {
    const pagination = getPaginationParams({ page, limit });
    const where: FindOptionsWhere<RecipeEntity> = {};
    if (filters?.labelContains)
      where.name = ILike(`%${filters.labelContains}%`);
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await this.repo.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit };
  }

  addRecipe(dto: CreateRecipeDto): Promise<RecipeEntity> {
    return this.dataSource.transaction(async (manager) => {
      await this.assertIngredientsExist(manager, dto);
      const saved = await manager.save(RecipeSchema, {
        name: dto.name,
        isActive: true,
        lines: this.toLines(dto),
      });
      return this.reload(manager, saved.id);
    });
  }

  updateRecipe(id: string, dto: UpdateRecipeDto): Promise<RecipeEntity> {
    return this.dataSource.transaction(async (manager) => {
      await this.reload(manager, id);
      await this.assertIngredientsExist(manager, dto);
      await manager.delete(RecipeLineSchema, { recipe: { id } });
      await manager.save(RecipeSchema, {
        id,
        name: dto.name,
        lines: this.toLines(dto),
      });
      return this.reload(manager, id);
    });
  }

  async setActive(id: string, isActive: boolean): Promise<RecipeEntity> {
    const result = await this.repo.update(id, { isActive });
    if (!result.affected)
      throw new NotFoundException(`Recette avec l'id ${id} introuvable`);
    return (await this.repo.findOneBy({ id }))!;
  }

  duplicateRecipe(id: string): Promise<RecipeEntity> {
    return this.dataSource.transaction(async (manager) => {
      const source = await this.reload(manager, id);
      const saved = await manager.save(RecipeSchema, {
        name: `${source.name} (copie)`,
        isActive: true,
        lines: source.lines.map((line) => ({
          quantity: line.quantity,
          ingredient: { id: line.ingredient.id },
        })),
      });
      return this.reload(manager, saved.id);
    });
  }

  private toLines(dto: CreateRecipeDto) {
    return dto.lines.map((line) => ({
      quantity: line.quantity,
      ingredient: { id: line.ingredientId },
    }));
  }

  private async reload(
    manager: EntityManager,
    id: string,
  ): Promise<RecipeEntity> {
    const recipe = await manager.findOne(RecipeSchema, { where: { id } });
    if (!recipe)
      throw new NotFoundException(`Recette avec l'id ${id} introuvable`);
    return recipe;
  }

  private async assertIngredientsExist(
    manager: EntityManager,
    dto: CreateRecipeDto,
  ): Promise<void> {
    const ids = dto.lines.map((line) => line.ingredientId);
    const count = await manager.count(IngredientSchema, {
      where: { id: In(ids) },
    });
    if (count !== ids.length)
      throw new BadRequestException(
        "Un des ingrédients de la recette n'existe pas",
      );
  }
}
