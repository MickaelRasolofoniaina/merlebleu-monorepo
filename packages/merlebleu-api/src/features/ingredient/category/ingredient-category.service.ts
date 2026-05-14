import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngredientCategoryEntity, IngredientCategorySchema } from './ingredient-category.entity';
import { CreateIngredientCategoryDto, UpdateIngredientCategoryDto } from './ingredient-category.dto';

@Injectable()
export class IngredientCategoryService {
  constructor(
    @InjectRepository(IngredientCategorySchema)
    private readonly categoryRepository: Repository<IngredientCategoryEntity>,
  ) {}

  findAll(): Promise<IngredientCategoryEntity[]> {
    return this.categoryRepository.find({ order: { label: 'ASC' } });
  }

  add(dto: CreateIngredientCategoryDto): Promise<IngredientCategoryEntity> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateIngredientCategoryDto): Promise<IngredientCategoryEntity> {
    await this.categoryRepository.update(id, dto);
    const updated = await this.categoryRepository.findOneBy({ id });
    if (!updated) throw new NotFoundException(`Catégorie avec l'id ${id} introuvable`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Catégorie avec l'id ${id} introuvable`);
    }
  }
}
