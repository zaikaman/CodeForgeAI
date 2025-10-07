import { useAuthContext } from '../contexts/AuthContext';

/**
 * useAuth Hook
 * Convenient hook to access authentication context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signIn, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   if (!user) {
 *     return <button onClick={() => signIn({ email, password })}>Sign In</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = useAuthContext;

export default useAuth;
