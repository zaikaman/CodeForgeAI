import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  signIn,
  signUp,
  signOut as supabaseSignOut,
  signInWithOAuth,
  SignInData,
  SignUpData,
} from '../lib/supabase';
import { useGenerationStore } from '../stores/generationStore';

/**
 * Auth Context
 * Manages authentication state and provides auth methods to the app
 */

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loadHistoryFromBackend = useGenerationStore((state) => state.loadHistoryFromBackend);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Load generation history from Supabase after authentication
      if (session?.user) {
        console.log('[AuthProvider] User authenticated, loading history from backend...');
        loadHistoryFromBackend().catch((error) => {
          console.error('[AuthProvider] Failed to load history:', error);
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Load history when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AuthProvider] User signed in, loading history from backend...');
        loadHistoryFromBackend().catch((error) => {
          console.error('[AuthProvider] Failed to load history:', error);
        });
      }

      // Clear history when user signs out
      if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] User signed out');
        // History will persist in localStorage but won't be shown until next login
      }
    });

    return () => subscription.unsubscribe();
  }, [loadHistoryFromBackend]);

  const handleSignIn = async (data: SignInData) => {
    try {
      const result = await signIn(data);
      setSession(result.session);
      setUser(result.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      const result = await signUp(data);
      // Note: User needs to confirm email before session is created
      if (result.session) {
        setSession(result.session);
        setUser(result.user);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const handleSignInWithGithub = async () => {
    try {
      await signInWithOAuth('github');
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithOAuth('google');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGithub: handleSignInWithGithub,
    signInWithGoogle: handleSignInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
