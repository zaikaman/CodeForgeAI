import { z } from 'zod';

export const fileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const generationSchema = z.object({
  files: z.array(fileSchema),
});
