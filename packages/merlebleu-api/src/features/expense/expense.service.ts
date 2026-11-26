import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ExpenseNature } from '@merlebleu/shared';
import { IngredientEntity } from '../ingredient/ingredient.entity';
import { PaymentMethodEntity } from '../sale/payment/payment.entity';
import { ExpenseCategoryEntity } from './category/expense-category.entity';
import { ExpenseEntity } from './expense.entity';
import {
  CopyFixedExpensesDto,
  CreateFixedExpenseDto,
  ListExpensesQueryDto,
  SetExpenseCellDto,
  UpdateFixedExpenseDto,
} from './expense.dto';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Month is 1-12. */
const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

/** Month is 1-12. */
const monthBounds = (year: number, month: number) => ({
  start: `${year}-${pad(month)}-01`,
  end: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
});

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(ExpenseCategoryEntity)
    private readonly categoryRepository: Repository<ExpenseCategoryEntity>,
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodRepository: Repository<PaymentMethodEntity>,
  ) {}

  findByMonth(query: ListExpensesQueryDto): Promise<ExpenseEntity[]> {
    const { start, end } = monthBounds(query.year, query.month);
    return this.expenseRepository.find({
      where: {
        date: Between(start, end),
        ...(query.nature ? { nature: query.nature } : {}),
      },
      order: { date: 'ASC', label: 'ASC' },
    });
  }

  /** Sets the total of one grid cell. An amount of 0 clears the cell and returns null. */
  async setCell(dto: SetExpenseCellDto): Promise<ExpenseEntity | null> {
    const target = dto.categoryId
      ? { category: { id: dto.categoryId } }
      : { ingredient: { id: dto.ingredientId } };

    const existing = await this.expenseRepository.findOne({
      where: { nature: ExpenseNature.VARIABLE, date: dto.date, ...target },
    });
    const chosenMethod = dto.paymentMethodId
      ? await this.getPaymentMethod(dto.paymentMethodId)
      : null;

    if (dto.amount === 0) {
      if (existing) {
        await this.expenseRepository.delete(existing.id);
      }
      return null;
    }

    if (existing) {
      existing.amount = dto.amount;
      if (chosenMethod) {
        existing.paymentMethod = chosenMethod;
      }
      return this.expenseRepository.save(existing);
    }

    // the wallet is the one chosen on the cell, else the default of the category or ingredient
    const owner = dto.categoryId
      ? await this.getCategory(dto.categoryId)
      : await this.getIngredient(dto.ingredientId as string);
    const paymentMethod = chosenMethod ?? owner.defaultPaymentMethod ?? null;

    return this.expenseRepository.save(
      this.expenseRepository.create({
        nature: ExpenseNature.VARIABLE,
        date: dto.date,
        amount: dto.amount,
        paymentMethod,
        ...target,
      }),
    );
  }

  async addFixed(dto: CreateFixedExpenseDto): Promise<ExpenseEntity> {
    const paymentMethod = await this.getPaymentMethod(dto.paymentMethodId);
    return this.expenseRepository.save(
      this.expenseRepository.create({
        nature: ExpenseNature.FIXED,
        date: dto.date,
        amount: dto.amount,
        fixedType: dto.fixedType,
        label: dto.label,
        detail: dto.detail || null,
        paid: dto.paid,
        paymentMethod,
      }),
    );
  }

  async updateFixed(
    id: string,
    dto: UpdateFixedExpenseDto,
  ): Promise<ExpenseEntity> {
    const expense = await this.getFixed(id);
    expense.paymentMethod = await this.getPaymentMethod(dto.paymentMethodId);
    expense.date = dto.date;
    expense.amount = dto.amount;
    expense.fixedType = dto.fixedType;
    expense.label = dto.label;
    expense.detail = dto.detail || null;
    expense.paid = dto.paid;
    return this.expenseRepository.save(expense);
  }

  async setPaid(id: string, paid: boolean): Promise<ExpenseEntity> {
    const expense = await this.getFixed(id);
    expense.paid = paid;
    return this.expenseRepository.save(expense);
  }

  async delete(id: string): Promise<void> {
    const result = await this.expenseRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Expense with id ${id} not found`);
    }
  }

  /**
   * Copies the fixed expenses of the month before the given one into it, as unpaid.
   * Lines that already exist in the target month (same type, label and detail) are skipped,
   * so calling it twice does not create duplicates. Returns the created expenses.
   */
  async copyFixedFromPreviousMonth(
    dto: CopyFixedExpensesDto,
  ): Promise<ExpenseEntity[]> {
    const previous =
      dto.month === 1
        ? { year: dto.year - 1, month: 12 }
        : { year: dto.year, month: dto.month - 1 };

    const [sources, existing] = await Promise.all([
      this.findByMonth({ ...previous, nature: ExpenseNature.FIXED }),
      this.findByMonth({
        year: dto.year,
        month: dto.month,
        nature: ExpenseNature.FIXED,
      }),
    ]);

    const keyOf = (e: ExpenseEntity) =>
      [e.fixedType, e.label, e.detail ?? ''].join('|').toLowerCase();
    const existingKeys = new Set(existing.map(keyOf));
    const maxDay = daysInMonth(dto.year, dto.month);

    const copies = sources
      .filter((source) => !existingKeys.has(keyOf(source)))
      .map((source) => {
        const day = Math.min(Number(source.date.slice(8, 10)), maxDay);
        return this.expenseRepository.create({
          nature: ExpenseNature.FIXED,
          date: `${dto.year}-${pad(dto.month)}-${pad(day)}`,
          amount: source.amount,
          fixedType: source.fixedType,
          label: source.label,
          detail: source.detail,
          paid: false,
          paymentMethod: source.paymentMethod,
        });
      });

    return this.expenseRepository.save(copies);
  }

  private async getFixed(id: string): Promise<ExpenseEntity> {
    const expense = await this.expenseRepository.findOneBy({ id });
    if (!expense) {
      throw new NotFoundException(`Expense with id ${id} not found`);
    }
    if (expense.nature !== ExpenseNature.FIXED) {
      throw new BadRequestException('This expense is not a fixed expense');
    }
    return expense;
  }

  private async getCategory(id: string): Promise<ExpenseCategoryEntity> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Expense category with id ${id} not found`);
    }
    return category;
  }

  private async getIngredient(id: string): Promise<IngredientEntity> {
    const ingredient = await this.ingredientRepository.findOneBy({ id });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient with id ${id} not found`);
    }
    return ingredient;
  }

  private async getPaymentMethod(id: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOneBy({ id });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }
    return paymentMethod;
  }
}
