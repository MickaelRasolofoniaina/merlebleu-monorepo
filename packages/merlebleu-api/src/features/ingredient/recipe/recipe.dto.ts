import { createRecipeSchema, updateRecipeSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateRecipeDto extends createZodDto(createRecipeSchema) {}

export class UpdateRecipeDto extends createZodDto(updateRecipeSchema) {}
