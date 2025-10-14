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
 * - Route to specialists (summary + needsSpecialist + specialistAgent + githubOperation)
 */
export const chatResponseSchema = z.object({
  files: z.array(chatFileSchema).optional(), // Only for specialist agents (CodeGenerator, CodeModification, etc.), NOT ChatAgent
  summary: z.string(),
  needsSpecialist: z.boolean().optional(),
  specialistAgent: z.string().optional(),
  githubOperation: z.object({
    type: z.enum(['create_pr', 'push_to_repo', 'create_repo_and_push', 'update_file', 'none']),
    repository: z.string().optional(), // repo name like "HealthCheckerSGU"
    branch: z.string().optional(), // branch name for PR
    prTitle: z.string().optional(),
    prBody: z.string().optional(),
    commitMessage: z.string().optional(),
    targetFile: z.string().optional(), // file to update (e.g., "README.md")
  }).optional() // GitHub operation instructions for specialist agents
});

// Pre-compiled and frozen schemas (immutable for performance)
Object.freeze(chatFileSchema);
Object.freeze(chatResponseSchema);

// Export types for TypeScript
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatFile = z.infer<typeof chatFileSchema>;
