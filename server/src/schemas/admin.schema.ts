import { z } from "zod";

export const updateMembershipSchema = z.object({
  membership: z.enum(["free", "premium", "admin"]),
});

export const userIdParamSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

export const adminStatsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional(),
  detailed: z.boolean().optional(),
});
