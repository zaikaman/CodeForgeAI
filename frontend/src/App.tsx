import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

/**
 * Example App Component
 * Demonstrates how to use AuthProvider, ProtectedRoute, and PublicRoute
 * 
 * This is a starter template - replace with your actual components
 */

// Placeholder components - replace with your actual pages
function LoginPage() {
  return <div>Login Page - TODO</div>;
}

function SignUpPage() {
  return <div>Sign Up Page - TODO</div>;
}

function DashboardPage() {
  return <div>Dashboard Page - TODO</div>;
}

function ProjectsPage() {
  return <div>Projects Page - TODO</div>;
}

function NotFoundPage() {
  return <div>404 - Page Not Found</div>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUpPage />
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
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
