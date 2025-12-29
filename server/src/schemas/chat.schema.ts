import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(4000, "Message cannot exceed 4000 characters"),
  context: z
    .string()
    .max(10000, "Context cannot exceed 10000 characters")
    .optional(),
  model: z.enum(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
});
