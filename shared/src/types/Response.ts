import { z } from 'zod'
import { GenerationType } from './Request'

/**
 * Shared Response Types
 * Used across frontend and backend for API response validation
 */

// Validation result schema
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  lintScore: z.number().min(0).max(100).optional(),
  testCoverage: z.number().min(0).max(100).optional(),
})

export type ValidationResult = z.infer<typeof ValidationResultSchema>

// Code snippet schema
export const CodeSnippetSchema = z.object({
  language: z.string(),
  content: z.string(),
  filePath: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
})

export type CodeSnippet = z.infer<typeof CodeSnippetSchema>

// Test file schema
export const TestFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  framework: z.string(),
  testCount: z.number().int().nonnegative().default(0),
})

export type TestFile = z.infer<typeof TestFileSchema>

// Confidence score schema
export const ConfidenceScoreSchema = z.object({
  overall: z.number().min(0).max(1),
  syntax: z.number().min(0).max(1),
  semantics: z.number().min(0).max(1),
  style: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
})

export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>

// Code output schema
export const CodeOutputSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  type: z.nativeEnum(GenerationType),
  code: CodeSnippetSchema,
  tests: z.array(TestFileSchema).default([]),
  validation: ValidationResultSchema,
  confidence: ConfidenceScoreSchema,
  explanation: z.string().optional(),
  alternatives: z.array(CodeSnippetSchema).default([]),
  tokensUsed: z.number().int().nonnegative().optional(),
  generationTime: z.number().nonnegative().optional(),
  agentId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CodeOutput = z.infer<typeof CodeOutputSchema>

// Severity level enum
export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// Finding category enum
export enum FindingCategory {
  BUG = 'bug',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  STYLE = 'style',
  MAINTAINABILITY = 'maintainability',
  BEST_PRACTICE = 'best-practice',
  DOCUMENTATION = 'documentation',
}

// Code location schema
export const CodeLocationSchema = z.object({
  file: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  startColumn: z.number().int().nonnegative().optional(),
  endColumn: z.number().int().nonnegative().optional(),
  snippet: z.string().optional(),
})

export type CodeLocation = z.infer<typeof CodeLocationSchema>

// Review finding schema
export const ReviewFindingSchema = z.object({
  id: z.string().uuid(),
  category: z.nativeEnum(FindingCategory),
  severity: z.nativeEnum(SeverityLevel),
  title: z.string(),
  description: z.string(),
  location: CodeLocationSchema,
  suggestion: z.string().optional(),
  fixCode: z.string().optional(),
  references: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  agentId: z.string().uuid().optional(),
})

export type ReviewFinding = z.infer<typeof ReviewFindingSchema>

// Code metrics schema
export const CodeMetricsSchema = z.object({
  complexity: z.number().nonnegative(),
  maintainability: z.number().min(0).max(100),
  testCoverage: z.number().min(0).max(100).optional(),
  duplicatedLines: z.number().nonnegative(),
  codeSmells: z.number().nonnegative(),
  technicalDebt: z.string().optional(),
  linesOfCode: z.number().nonnegative(),
})

export type CodeMetrics = z.infer<typeof CodeMetricsSchema>

// Review summary schema
export const ReviewSummarySchema = z.object({
  totalFindings: z.number().nonnegative(),
  criticalCount: z.number().nonnegative(),
  highCount: z.number().nonnegative(),
  mediumCount: z.number().nonnegative(),
  lowCount: z.number().nonnegative(),
  infoCount: z.number().nonnegative(),
  overallScore: z.number().min(0).max(100),
  recommendation: z.enum(['approve', 'needs-work', 'reject']),
})

export type ReviewSummary = z.infer<typeof ReviewSummarySchema>

// Review report schema
export const ReviewReportSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  targetFile: z.string().optional(),
  findings: z.array(ReviewFindingSchema),
  metrics: CodeMetricsSchema,
  summary: ReviewSummarySchema,
  agentIds: z.array(z.string().uuid()),
  reviewTime: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type ReviewReport = z.infer<typeof ReviewReportSchema>

// Enhancement proposal schema
export const EnhancementProposalSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['refactor', 'optimize', 'security', 'modernize']),
  impact: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['high', 'medium', 'low']),
  diff: z.string(),
  beforeCode: z.string(),
  afterCode: z.string(),
  files: z.array(z.string()),
  benefits: z.array(z.string()),
  risks: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  agentId: z.string().uuid().optional(),
  createdAt: z.date(),
})

export type EnhancementProposal = z.infer<typeof EnhancementProposalSchema>
