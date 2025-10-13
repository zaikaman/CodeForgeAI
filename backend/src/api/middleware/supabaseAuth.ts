import { Request, Response, NextFunction } from 'express'
import { getSupabaseClient } from '../../storage/SupabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Supabase Auth Middleware
 * Validates JWT tokens from Supabase Auth and attaches user info to request
 */

/**
 * Circuit breaker for Supabase connection
 * Prevents repeated attempts when Supabase is experiencing issues
 */
interface CircuitBreaker {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const circuitBreaker: CircuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false,
}

const CIRCUIT_BREAKER_THRESHOLD = 5 // Open circuit after 5 failures
const CIRCUIT_BREAKER_TIMEOUT = 30000 // Try again after 30 seconds
const CIRCUIT_BREAKER_RESET_TIME = 60000 // Reset failure count after 60 seconds of success

/**
 * Check if circuit breaker allows request
 */
function canMakeRequest(): boolean {
  const now = Date.now()
  
  // If circuit is open and timeout hasn't passed, don't allow request
  if (circuitBreaker.isOpen && now - circuitBreaker.lastFailureTime < CIRCUIT_BREAKER_TIMEOUT) {
    return false
  }
  
  // If circuit is open but timeout passed, close it and allow request (half-open state)
  if (circuitBreaker.isOpen && now - circuitBreaker.lastFailureTime >= CIRCUIT_BREAKER_TIMEOUT) {
    circuitBreaker.isOpen = false
    circuitBreaker.failures = 0
  }
  
  return true
}

/**
 * Record successful request
 */
function recordSuccess(): void {
  const now = Date.now()
  
  // If we've been successful for a while, reset failure count
  if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_RESET_TIME) {
    circuitBreaker.failures = 0
  }
  
  circuitBreaker.isOpen = false
}

/**
 * Record failed request
 */
function recordFailure(): void {
  circuitBreaker.failures++
  circuitBreaker.lastFailureTime = Date.now()
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true
    console.warn(`[CircuitBreaker] 🔴 Circuit opened - Supabase appears to be down. Will retry in ${CIRCUIT_BREAKER_TIMEOUT/1000}s`)
  }
}

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  supabaseUser?: User
  userId?: string
  accessToken?: string
}

/**
 * Middleware to validate Supabase JWT token
 * Expects Authorization header with Bearer token
 */
export async function supabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      })
      return
    }

    // Verify JWT token with Supabase
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid token',
      })
      return
    }

    // Attach user info to request
    req.supabaseUser = data.user
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: (data.user.user_metadata?.role as string) || 'user',
    }
    req.userId = data.user.id
    req.accessToken = token

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate request',
    })
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that can work with or without authentication
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    // If no auth header, just continue without setting user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[optionalAuth] No auth header found for ${req.method} ${req.path}`)
      next()
      return
    }

    const token = authHeader.substring(7)

    if (!token) {
      console.log(`[optionalAuth] Empty token for ${req.method} ${req.path}`)
      next()
      return
    }

    // Check circuit breaker - if it's open, skip auth check
    if (!canMakeRequest()) {
      console.warn(`[optionalAuth] 🔴 Circuit breaker is open for ${req.method} ${req.path} - skipping auth`)
      next()
      return
    }

    // Try to verify token with timeout, but don't fail if network issues
    try {
      const supabase = getSupabaseClient()
      
      // Create a shorter timeout for optional auth (3 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase auth timeout')), 3000)
      })
      
      // Race between auth check and timeout
      const result = await Promise.race([
        supabase.auth.getUser(token),
        timeoutPromise
      ])

      const { data, error } = result as any

      if (!error && data?.user) {
        req.supabaseUser = data.user
        req.user = {
          id: data.user.id,
          email: data.user.email,
          role: (data.user.user_metadata?.role as string) || 'user',
        }
        req.userId = data.user.id
        req.accessToken = token
        console.log(`[optionalAuth] ✓ User authenticated: ${data.user.id} (${data.user.email}) for ${req.method} ${req.path}`)
        recordSuccess()
      } else {
        console.warn(`[optionalAuth] ✗ Token validation failed for ${req.method} ${req.path}:`, error?.message)
        recordFailure()
      }
    } catch (authError: any) {
      // Handle network/timeout errors gracefully
      const errorMessage = authError?.message || ''
      const errorCode = authError?.cause?.code || ''
      
      if (errorMessage.includes('timeout') || 
          errorCode === 'UND_ERR_CONNECT_TIMEOUT' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNREFUSED') {
        console.warn(`[optionalAuth] ⏱️ Supabase timeout/connection error for ${req.method} ${req.path} - continuing without auth`)
        recordFailure()
      } else if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
        console.warn(`[optionalAuth] 🌐 Supabase network error for ${req.method} ${req.path} - continuing without auth`)
        recordFailure()
      } else {
        console.warn(`[optionalAuth] ⚠️ Auth check failed for ${req.method} ${req.path}:`, errorMessage)
      }
      // Continue without authentication - this is the key behavior for optionalAuth
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    // Don't fail, just continue without user
    next()
  }
}

/**
 * Middleware to check if user has specific role
 * Must be used after supabaseAuth middleware
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      return
    }

    const userRole: string = req.user.role || 'user'

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      })
      return
    }

    next()
  }
}

/**
 * Middleware to verify user owns a resource
 * Checks if userId in request params matches authenticated user
 */
export function requireOwnership(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    _res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const resourceUserId: string | undefined =
    req.params.userId || (req.body.userId as string | undefined)

  if (resourceUserId && resourceUserId !== req.userId) {
    _res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource',
    })
    return
  }

  next()
}

/**
 * Alias for supabaseAuth for consistent naming
 */
export const requireAuth = supabaseAuth

/**
 * Middleware to extract user from service role operations
 * For backend operations that need to act on behalf of a user
 */
export function serviceRoleAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Check for service role API key
    const apiKey = req.headers['x-service-key'] as string
    const expectedKey = process.env.SERVICE_API_KEY

    if (!expectedKey) {
      res.status(500).json({
        error: 'Configuration Error',
        message: 'Service API key not configured',
      })
      return
    }

    if (!apiKey || apiKey !== expectedKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid service API key',
      })
      return
    }

    // Extract userId from request body for service role operations
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId: string | undefined =
      (req.body.userId as string | undefined) || (req.query.userId as string | undefined)

    if (userId) {
      req.userId = userId
    }

    next()
  } catch (error) {
    console.error('Service role auth error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate service request',
    })
  }
}
