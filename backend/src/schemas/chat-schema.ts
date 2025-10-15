import { z } from 'zod';

// Pre-compile chat response schema once for better performance
export const chatFileSchema = z.object({
  path: z.string(),
  content: z.string()
});

/**
 * Chat response schema used by agents
 * 
 * ⚠️ CRITICAL RULES:
 * 
 * 1. ChatAgent (Router):
 *    - Conversational: { summary: string }
 *    - Routing: { summary: string, needsSpecialist: true, specialistAgent: string }
 *    - NEVER uses 'files' field
 * 
 * 2. Specialist Agents (SimpleCoder, ComplexCoder, CodeModification, etc.):
 *    - Code generation: { summary: string, files: [...] }
 *    - Can optionally include githubOperation for GitHub integration
 */
export const chatResponseSchema = z.object({
  files: z.array(chatFileSchema).optional(), // Only for specialist agents, NOT ChatAgent
  summary: z.string().describe('Brief explanation of the action taken or routing decision'),
  needsSpecialist: z.boolean().optional().describe('True if routing to a specialist agent'),
  specialistAgent: z.string().optional().describe('Name of specialist agent to route to (GitHubAgent, SimpleCoder, ComplexCoder, CodeModification, etc.)'),
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
