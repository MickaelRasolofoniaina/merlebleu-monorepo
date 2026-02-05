import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreatePaymentMethodDto extends createZodDto(
  createPaymentMethodSchema,
) {}

export class UpdatePaymentMethodDto extends createZodDto(
  updatePaymentMethodSchema,
) {}
