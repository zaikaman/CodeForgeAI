import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Shows loading state while checking authentication
 */

export interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 * Useful for login/signup pages
 */

export interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicRoute({
  children,
  redirectTo = '/dashboard',
}: PublicRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Don't redirect while loading
  if (loading) {
    return <>{children}</>;
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    const from = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, render children
  return <>{children}</>;
}

export default ProtectedRoute;
