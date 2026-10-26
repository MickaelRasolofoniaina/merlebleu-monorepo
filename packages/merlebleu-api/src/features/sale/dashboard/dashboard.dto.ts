import { createZodDto } from 'nestjs-zod';
import { dashboardQuerySchema } from '@merlebleu/shared';

export class DashboardQueryDto extends createZodDto(dashboardQuerySchema) {}
