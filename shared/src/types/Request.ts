import { z } from 'zod'

/**
 * Shared Request Types
 * Used across frontend and backend for API request validation
 */

// Generation type enum
export enum GenerationType {
  CODE = 'code',
  TEST = 'test',
  REFACTOR = 'refactor',
  FIX = 'fix',
  OPTIMIZE = 'optimize',
  DOCUMENT = 'document',
}

// Generation options schema
export const GenerationOptionsSchema = z.object({
  language: z.string().optional(),
  framework: z.string().optional(),
  style: z.enum(['functional', 'oop', 'mixed']).optional(),
  testFramework: z.string().optional(),
  includeTests: z.boolean().default(false),
  includeComments: z.boolean().default(true),
  includeTypeHints: z.boolean().default(true),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  streaming: z.boolean().default(false),
})

export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>

// Context file schema
export const ContextFileSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
})

export type ContextFile = z.infer<typeof ContextFileSchema>

// Generation request schema
export const GenerationRequestSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(GenerationType),
  prompt: z.string().min(1),
  projectId: z.string().uuid(),
  contextFiles: z.array(ContextFileSchema).default([]),
  options: GenerationOptionsSchema.default({}),
  targetFile: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  userId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>

// Review request schema
export const ReviewRequestSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  targetFile: z.string().optional(),
  code: z.string().min(1),
  language: z.string(),
  options: z
    .object({
      checkSecurity: z.boolean().default(true),
      checkPerformance: z.boolean().default(true),
      checkStyle: z.boolean().default(true),
      checkBestPractices: z.boolean().default(true),
    })
    .default({}),
  userId: z.string().optional(),
  createdAt: z.date(),
})

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>

// Enhancement request schema
export const EnhancementRequestSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  targetFile: z.string(),
  code: z.string().min(1),
  enhancementType: z.enum(['refactor', 'optimize', 'modernize', 'security']),
  options: z
    .object({
      preserveInterface: z.boolean().default(true),
      addTests: z.boolean().default(false),
      addDocs: z.boolean().default(true),
    })
    .default({}),
  userId: z.string().optional(),
  createdAt: z.date(),
})

export type EnhancementRequest = z.infer<typeof EnhancementRequestSchema>
