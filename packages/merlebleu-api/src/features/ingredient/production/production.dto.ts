import { saveProductionDaySchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class SaveProductionDayDto extends createZodDto(
  saveProductionDaySchema,
) {}
