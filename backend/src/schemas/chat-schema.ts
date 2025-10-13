import { z } from 'zod';

// Pre-compile chat response schema once for better performance
export const chatFileSchema = z.object({
  path: z.string(),
  content: z.string()
});

/**
 * Chat response schema used by agents
 * NOTE: ChatAgent should NEVER use the 'files' field - it's for specialist agents only
 * ChatAgent can only:
 * - Return conversational responses (summary only)
 * - Route to specialists (summary + needsSpecialist + specialistAgent)
 */
export const chatResponseSchema = z.object({
  files: z.array(chatFileSchema).optional(), // Only for specialist agents (CodeGenerator, CodeModification, etc.), NOT ChatAgent
  summary: z.string(),
  needsSpecialist: z.boolean().optional(),
  specialistAgent: z.string().optional()
});

// Pre-compiled and frozen schemas (immutable for performance)
Object.freeze(chatFileSchema);
Object.freeze(chatResponseSchema);

// Export types for TypeScript
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatFile = z.infer<typeof chatFileSchema>;
