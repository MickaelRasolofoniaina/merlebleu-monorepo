import z from "zod";
import { DashboardView } from "./dashboard";

export const dashboardQuerySchema = z.object({
  view: z.enum(DashboardView),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
