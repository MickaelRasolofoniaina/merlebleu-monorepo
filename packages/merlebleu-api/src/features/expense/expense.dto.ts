import {
  copyFixedExpensesSchema,
  createFixedExpenseSchema,
  listExpensesQuerySchema,
  setExpenseCellSchema,
  setExpensePaidSchema,
  updateFixedExpenseSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateFixedExpenseDto extends createZodDto(
  createFixedExpenseSchema,
) {}

export class UpdateFixedExpenseDto extends createZodDto(
  updateFixedExpenseSchema,
) {}

export class SetExpenseCellDto extends createZodDto(setExpenseCellSchema) {}

export class SetExpensePaidDto extends createZodDto(setExpensePaidSchema) {}

export class ListExpensesQueryDto extends createZodDto(
  listExpensesQuerySchema,
) {}

export class CopyFixedExpensesDto extends createZodDto(
  copyFixedExpensesSchema,
) {}
