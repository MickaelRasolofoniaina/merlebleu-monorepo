import { z } from "zod";
import { MovementType } from "./movement";

const day = z.iso.date();

export const listMovementsQuerySchema = z.object({
  /** A wallet id, or "none" for movements with no wallet. */
  walletId: z.union([z.uuid(), z.literal("none")]).optional(),
  type: z.enum(MovementType).optional(),
  from: day.optional(),
  to: day.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const exportMovementsQuerySchema = listMovementsQuerySchema.omit({
  page: true,
  limit: true,
});

export type ListMovementsQueryDto = z.infer<typeof listMovementsQuerySchema>;
export type ExportMovementsQueryDto = z.infer<typeof exportMovementsQuerySchema>;
