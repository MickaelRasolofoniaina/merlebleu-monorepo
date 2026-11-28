import {
  createStockEntriesSchema,
  updateStockEntrySchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateStockEntriesDto extends createZodDto(
  createStockEntriesSchema,
) {}
export class UpdateStockEntryDto extends createZodDto(updateStockEntrySchema) {}
