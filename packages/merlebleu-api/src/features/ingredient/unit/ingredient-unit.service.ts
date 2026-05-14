import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngredientUnitEntity, IngredientUnitSchema } from './ingredient-unit.entity';
import { CreateIngredientUnitDto, UpdateIngredientUnitDto } from './ingredient-unit.dto';

@Injectable()
export class IngredientUnitService {
  constructor(
    @InjectRepository(IngredientUnitSchema)
    private readonly unitRepository: Repository<IngredientUnitEntity>,
  ) {}

  findAll(): Promise<IngredientUnitEntity[]> {
    return this.unitRepository.find({ order: { label: 'ASC' } });
  }

  add(dto: CreateIngredientUnitDto): Promise<IngredientUnitEntity> {
    const unit = this.unitRepository.create(dto);
    return this.unitRepository.save(unit);
  }

  async update(id: string, dto: UpdateIngredientUnitDto): Promise<IngredientUnitEntity> {
    await this.unitRepository.update(id, dto);
    const updated = await this.unitRepository.findOneBy({ id });
    if (!updated) throw new NotFoundException(`Unité avec l'id ${id} introuvable`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.unitRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Unité avec l'id ${id} introuvable`);
    }
  }
}
