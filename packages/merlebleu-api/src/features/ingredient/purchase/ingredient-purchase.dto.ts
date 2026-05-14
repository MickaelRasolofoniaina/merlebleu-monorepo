import {
  createIngredientPurchaseSchema,
  updateIngredientPurchaseSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateIngredientPurchaseDto extends createZodDto(
  createIngredientPurchaseSchema,
) {}
export class UpdateIngredientPurchaseDto extends createZodDto(
  updateIngredientPurchaseSchema,
) {}
