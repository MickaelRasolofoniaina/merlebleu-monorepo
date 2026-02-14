import { createOrderSchema, updateOrderSchema } from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderDto extends createZodDto(createOrderSchema) {}

export class UpdateOrderDto extends createZodDto(updateOrderSchema) {}
