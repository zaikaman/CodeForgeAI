import { z } from 'zod';

// Pre-compile chat response schema once for better performance
export const chatFileSchema = z.object({
  path: z.string(),
  content: z.string()
});

export const chatResponseSchema = z.object({
  files: z.array(chatFileSchema),
  summary: z.string().optional()
});

// Pre-compiled and frozen schemas (immutable for performance)
Object.freeze(chatFileSchema);
Object.freeze(chatResponseSchema);

// Export types for TypeScript
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatFile = z.infer<typeof chatFileSchema>;
