import { createItemSchema, updateItemSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateItemDto extends createZodDto(createItemSchema) {}

export class UpdateItemDto extends createZodDto(updateItemSchema) {}
