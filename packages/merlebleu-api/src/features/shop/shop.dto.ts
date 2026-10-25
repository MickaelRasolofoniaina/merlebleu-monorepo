import { createShopSchema, updateShopSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateShopDto extends createZodDto(createShopSchema) {}
export class UpdateShopDto extends createZodDto(updateShopSchema) {}
