import { z } from 'zod'

/**
 * Shared Configuration Types
 * Environment variables and application configuration
 */

// Environment configuration schema
export const EnvironmentConfigSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('glm-4.6'),
  OPENAI_BASE_URL: z.string().url().optional(),

  // Supabase Configuration
  SUPABASE_URL: z.string().url('Valid Supabase URL is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),

  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().url().optional(),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  // Session Configuration
  SESSION_SECRET: z.string().min(32).optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Feature Flags
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
  ENABLE_CACHING: z.coerce.boolean().default(true),
  ENABLE_WEBSOCKETS: z.coerce.boolean().default(true),
})

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>

// Application options schema
export const ApplicationOptionsSchema = z.object({
  // Code Generation Options
  defaultLanguage: z.string().default('typescript'),
  defaultFramework: z.string().optional(),
  maxTokensPerRequest: z.number().int().positive().default(4000),
  defaultTemperature: z.number().min(0).max(2).default(0.7),

  // Embedding Options
  embeddingModel: z.string().default('all-MiniLM-L6-v2'),
  embeddingDimensions: z.number().int().positive().default(384),
  maxEmbeddingBatchSize: z.number().int().positive().default(32),

  // Vector Memory Options
  vectorSearchTopK: z.number().int().positive().default(5),
  vectorSearchThreshold: z.number().min(0).max(1).default(0.7),

  // Agent Options
  maxAgentRetries: z.number().int().nonnegative().default(3),
  agentTimeout: z.number().int().positive().default(60000), // 60 seconds

  // Review Options
  defaultReviewChecks: z
    .object({
      security: z.boolean().default(true),
      performance: z.boolean().default(true),
      style: z.boolean().default(true),
      bestPractices: z.boolean().default(true),
    })
    .default({}),

  // File Processing
  maxFileSize: z.number().int().positive().default(10485760), // 10MB
  maxFilesPerProject: z.number().int().positive().default(1000),
  supportedLanguages: z
    .array(z.string())
    .default(['typescript', 'javascript', 'python', 'java', 'go', 'rust']),
})

export type ApplicationOptions = z.infer<typeof ApplicationOptionsSchema>

// Database configuration schema
export const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  database: z.string(),
  user: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().default(false),
  maxConnections: z.number().int().positive().default(10),
  connectionTimeout: z.number().int().positive().default(5000),
})

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>

// Tool integration configuration
export const ToolIntegrationConfigSchema = z.object({
  // GitHub Integration
  github: z
    .object({
      enabled: z.boolean().default(false),
      token: z.string().optional(),
      baseUrl: z.string().url().optional(),
    })
    .optional(),

  // SonarQube Integration
  sonarqube: z
    .object({
      enabled: z.boolean().default(false),
      url: z.string().url().optional(),
      token: z.string().optional(),
      projectKey: z.string().optional(),
    })
    .optional(),

  // External API Integration
  external: z
    .object({
      enabled: z.boolean().default(false),
      apiUrl: z.string().url().optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
})

export type ToolIntegrationConfig = z.infer<typeof ToolIntegrationConfigSchema>

// Complete application configuration
export const AppConfigSchema = z.object({
  environment: EnvironmentConfigSchema,
  options: ApplicationOptionsSchema,
  integrations: ToolIntegrationConfigSchema.optional(),
})

export type AppConfig = z.infer<typeof AppConfigSchema>
