import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../expense.entity';
import { ExpenseCategoryEntity } from './expense-category.entity';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './expense-category.dto';

@Injectable()
export class ExpenseCategoryService {
  constructor(
    @InjectRepository(ExpenseCategoryEntity)
    private readonly categoryRepository: Repository<ExpenseCategoryEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  getAll(): Promise<ExpenseCategoryEntity[]> {
    return this.categoryRepository.find({
      order: { section: 'ASC', label: 'ASC' },
    });
  }

  async add(dto: CreateExpenseCategoryDto): Promise<ExpenseCategoryEntity> {
    await this.assertLabelIsFree(dto.label, dto.section);
    return this.categoryRepository.save(this.categoryRepository.create(dto));
  }

  async update(
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryEntity> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Expense category with id ${id} not found`);
    }
    await this.assertLabelIsFree(dto.label, dto.section, id);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<void> {
    const usageCount = await this.expenseRepository.count({
      where: { category: { id } },
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cette catégorie est utilisée par ${usageCount} dépense(s) et ne peut pas être supprimée`,
      );
    }
    const result = await this.categoryRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Expense category with id ${id} not found`);
    }
  }

  private async assertLabelIsFree(
    label: string,
    section: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(category.label) = LOWER(:label)', { label })
      .andWhere('category.section = :section', { section })
      .getOne();
    if (existing && existing.id !== excludedId) {
      throw new BadRequestException(
        'Une catégorie portant cette désignation existe déjà dans cette section',
      );
    }
  }
}
