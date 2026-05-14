import { createIngredientUnitSchema, updateIngredientUnitSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateIngredientUnitDto extends createZodDto(createIngredientUnitSchema) {}

export class UpdateIngredientUnitDto extends createZodDto(updateIngredientUnitSchema) {}
