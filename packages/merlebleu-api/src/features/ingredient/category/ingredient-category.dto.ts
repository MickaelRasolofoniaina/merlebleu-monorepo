import {
  createIngredientCategorySchema,
  updateIngredientCategorySchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateIngredientCategoryDto extends createZodDto(
  createIngredientCategorySchema,
) {}

export class UpdateIngredientCategoryDto extends createZodDto(
  updateIngredientCategorySchema,
) {}
