import { Request, Response, NextFunction } from 'express'
import { getSupabaseClient } from '../../storage/SupabaseClient'
import { User } from '@supabase/supabase-js'

/**
 * Supabase Auth Middleware
 * Validates JWT tokens from Supabase Auth and attaches user info to request
 */

/**
 * Extended Express Request with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: User
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
    req.user = data.user
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
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    // If no auth header, just continue without setting user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.substring(7)

    if (!token) {
      next()
      return
    }

    // Try to verify token, but don't fail if invalid
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (!error && data.user) {
      req.user = data.user
      req.userId = data.user.id
      req.accessToken = token
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userRole: string = (req.user.user_metadata?.role as string) || 'user'

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
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    })
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const resourceUserId: string | undefined =
    req.params.userId || (req.body.userId as string | undefined)

  if (resourceUserId && resourceUserId !== req.userId) {
    res.status(403).json({
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
