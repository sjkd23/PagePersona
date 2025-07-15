import { z } from 'zod';

export const transformSchema = z.object({
  url: z.string().url(),
  persona: z.string().min(1),
  options: z
    .object({
      truncateLength: z.number().int().positive().optional(),
    })
    .optional(),
});

export const transformTextSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  persona: z.string().min(1),
  options: z
    .object({
      truncateLength: z.number().int().positive().optional(),
    })
    .optional(),
});
