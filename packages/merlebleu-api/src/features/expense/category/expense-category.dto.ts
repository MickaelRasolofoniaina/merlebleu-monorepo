import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateExpenseCategoryDto extends createZodDto(
  createExpenseCategorySchema,
) {}

export class UpdateExpenseCategoryDto extends createZodDto(
  updateExpenseCategorySchema,
) {}
