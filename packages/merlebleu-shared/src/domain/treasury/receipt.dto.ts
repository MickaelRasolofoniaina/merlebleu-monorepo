import { z } from "zod";
import { ReceiptPeriod } from "./receipt";

export const receiptQuerySchema = z.object({
  period: z.enum(ReceiptPeriod),
  /** Any day inside the wanted day, month or year. */
  date: z.iso.date(),
});

export type ReceiptQueryDto = z.infer<typeof receiptQuerySchema>;
