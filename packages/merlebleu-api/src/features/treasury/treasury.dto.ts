import {
  createCashCountSchema,
  createRefundSchema,
  createTransferSchema,
  exportMovementsQuerySchema,
  listMovementsQuerySchema,
  receiptQuerySchema,
  updateWalletSchema,
} from '@merlebleu/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateWalletDto extends createZodDto(updateWalletSchema) {}

export class CreateTransferDto extends createZodDto(createTransferSchema) {}

export class CreateRefundDto extends createZodDto(createRefundSchema) {}

export class CreateCashCountDto extends createZodDto(createCashCountSchema) {}

export class ListMovementsQueryDto extends createZodDto(
  listMovementsQuerySchema,
) {}

export class ExportMovementsQueryDto extends createZodDto(
  exportMovementsQuerySchema,
) {}

export class ReceiptQueryDto extends createZodDto(receiptQuerySchema) {}
