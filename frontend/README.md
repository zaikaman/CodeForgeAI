# Frontend Authentication Setup

This directory contains the frontend authentication implementation using Supabase Auth.

## 📁 Structure

```
src/
├── lib/
│   └── supabase.ts          # Supabase client and auth helpers
├── contexts/
│   └── AuthContext.tsx      # Auth state management context
├── hooks/
│   └── useAuth.ts           # Hook to access auth context
├── components/
│   └── ProtectedRoute.tsx   # Route guards for auth
├── App.tsx                  # Example app with routes
├── main.tsx                 # Entry point
├── index.ts                 # Barrel exports
└── vite-env.d.ts            # TypeScript env types
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔐 Usage

### Wrap Your App with AuthProvider

```tsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

function Main() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Use the useAuth Hook

```tsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <button onClick={() => signIn({ email: 'user@example.com', password: 'password' })}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protect Routes

```tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if authenticated */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes - require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## 📚 API Reference

### AuthContext

Provides authentication state and methods.

```tsx
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
```

### useAuth Hook

Returns the auth context.

```tsx
const { user, loading, signIn, signOut } = useAuth();
```

### ProtectedRoute Component

Redirects to login if user is not authenticated.

**Props:**
- `children`: ReactNode - The component to render if authenticated
- `redirectTo`: string - Path to redirect if not authenticated (default: `/login`)
- `fallback`: ReactNode - Custom loading component

```tsx
<ProtectedRoute redirectTo="/login" fallback={<LoadingSpinner />}>
  <DashboardPage />
</ProtectedRoute>
```

### PublicRoute Component

Redirects to dashboard if user is already authenticated (useful for login/signup pages).

**Props:**
- `children`: ReactNode - The component to render if not authenticated
- `redirectTo`: string - Path to redirect if authenticated (default: `/dashboard`)

```tsx
<PublicRoute redirectTo="/dashboard">
  <LoginPage />
</PublicRoute>
```

### Supabase Client

Direct access to Supabase client and helper functions.

```tsx
import {
  supabase,
  signIn,
  signUp,
  signOut,
  signInWithOAuth,
  getCurrentUser,
  getSession,
  resetPassword,
  updatePassword,
  updateProfile,
} from './lib/supabase';

// Sign up
await signUp({
  email: 'user@example.com',
  password: 'password',
  displayName: 'John Doe',
});

// Sign in
await signIn({
  email: 'user@example.com',
  password: 'password',
});

// OAuth
await signInWithOAuth('github');
await signInWithOAuth('google');

// Get current user
const user = await getCurrentUser();

// Get session
const session = await getSession();

// Reset password
await resetPassword('user@example.com');

// Update password
await updatePassword('newPassword');

// Update profile
await updateProfile({
  display_name: 'Jane Doe',
  avatar_url: 'https://example.com/avatar.jpg',
});
```

## 🔧 Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Add them to your `.env` file
4. Configure OAuth providers (optional):
   - Go to Authentication > Providers
   - Enable GitHub, Google, etc.
   - Add redirect URLs

### Redirect URLs

Add these redirect URLs to your Supabase project:

- `http://localhost:5173/auth/callback` (development)
- `https://yourdomain.com/auth/callback` (production)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

The frontend is configured for Vercel deployment. See the root `vercel.json` for configuration.

```bash
# Deploy to Vercel
vercel deploy
```

## 🔒 Security

- Uses Supabase's built-in Row Level Security (RLS)
- JWT tokens are automatically managed by Supabase
- Sessions are persisted in localStorage with automatic refresh
- All auth operations use secure HTTPS

## 📖 Learn More

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
