import { z } from "zod";

export const userProfileUpdateSchema = z
  .object({
    firstName: z
      .string()
      .max(50, "First name cannot exceed 50 characters")
      .optional(),
    lastName: z
      .string()
      .max(50, "Last name cannot exceed 50 characters")
      .optional(),
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(100, "Display name cannot exceed 100 characters")
      .optional(),
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
    preferences: z
      .object({
        theme: z.enum(["light", "dark", "auto"]).optional(),
        language: z.string().min(2).max(5).optional(),
        notifications: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const userProfileQuerySchema = z.object({
  include: z.enum(["stats", "preferences", "history"]).optional(),
});
