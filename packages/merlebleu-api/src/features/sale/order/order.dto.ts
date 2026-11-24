import {
  createOrderSchema,
  deliverOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderDto extends createZodDto(createOrderSchema) {}

export class UpdateOrderDto extends createZodDto(updateOrderSchema) {}

export class UpdateOrderStatusDto extends createZodDto(
  updateOrderStatusSchema,
) {}

export class DeliverOrderDto extends createZodDto(deliverOrderSchema) {}
