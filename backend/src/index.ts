import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { checkSupabaseConnection } from './storage/SupabaseClient'

// Load environment variables
dotenv.config({ path: '../.env' })

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CodeForge AI Backend',
  })
})

// Supabase connection check endpoint
app.get('/api/health/database', (_req: Request, res: Response): void => {
  checkSupabaseConnection()
    .then(isConnected => {
      if (isConnected) {
        res.json({
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
        })
      } else {
        res.status(503).json({
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        })
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(503).json({
        status: 'error',
        database: 'error',
        message,
        timestamp: new Date().toISOString(),
      })
    })
})

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'CodeForge AI API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      database: '/api/health/database',
      docs: '/api/docs',
    },
  })
})

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  })
})

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
})

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log('🚀 CodeForge AI Backend Server Starting...\n')
  // eslint-disable-next-line no-console
  console.log(`📡 Server running on: http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  // eslint-disable-next-line no-console
  console.log(`💾 Database check: http://localhost:${PORT}/api/health/database`)
  // eslint-disable-next-line no-console
  console.log(`\n✨ Environment: ${process.env.NODE_ENV || 'development'}`)
  // eslint-disable-next-line no-console
  console.log('📝 Press Ctrl+C to stop\n')

  // Test database connection on startup
  checkSupabaseConnection()
    .then(isConnected => {
      if (isConnected) {
        // eslint-disable-next-line no-console
        console.log('✅ Supabase connection verified\n')
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️  Could not connect to Supabase\n')
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('❌ Supabase connection error:', message, '\n')
    })
})

export default app
