/**
 * Auth Barrel Export
 * Centralized exports for authentication-related modules
 */

// Context
export { AuthProvider, useAuthContext } from './contexts/AuthContext';
export type { AuthContextType, AuthProviderProps } from './contexts/AuthContext';

// Hook
export { useAuth } from './hooks/useAuth';

// Components
export { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
export type {
  ProtectedRouteProps,
  PublicRouteProps,
} from './components/ProtectedRoute';

// Supabase client and helpers
export {
  supabase,
  signUp,
  signIn,
  signOut,
  signInWithOAuth,
  getSession,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateProfile,
  onAuthStateChange,
} from './lib/supabase';
export type { SignUpData, SignInData } from './lib/supabase';
