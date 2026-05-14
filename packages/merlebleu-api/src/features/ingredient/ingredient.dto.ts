import {
  createIngredientSchema,
  updateIngredientSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateIngredientDto extends createZodDto(createIngredientSchema) {}

export class UpdateIngredientDto extends createZodDto(updateIngredientSchema) {}
