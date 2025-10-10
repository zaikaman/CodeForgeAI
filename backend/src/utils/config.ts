import { config as dotenvConfig } from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenvConfig()

// Define the configuration schema
const configSchema = z.object({
  openaiApiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  supabaseUrl: z.string().url('SUPABASE_URL must be a valid URL'),
  supabaseAnonKey: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  supabaseServiceKey: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  githubToken: z.string().optional(),
  sonarqubeUrl: z.string().url().optional().or(z.literal('')),
  sonarqubeToken: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

/**
 * Validate and parse environment variables
 * Throws error if required variables are missing
 */
export function loadConfig(): Config {
  try {
    return configSchema.parse({
      openaiApiKey: process.env.OPENAI_API_KEY,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
      githubToken: process.env.GITHUB_TOKEN,
      sonarqubeUrl: process.env.SONARQUBE_URL,
      sonarqubeToken: process.env.SONARQUBE_TOKEN,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => err.path.join('.')).join(', ')
      throw new Error(
        `Environment validation failed: ${missingVars}\\n` +
          'Please check your .env file and ensure all required variables are set.\\n' +
          'Copy .env.example to .env and fill in the values.'
      )
    }
    throw error
  }
}

// Singleton instance
let configInstance: Config | null = null

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig()
  }
  return configInstance
}
