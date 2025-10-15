import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useUIStore } from './stores/uiStore'

// Pages
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { AuthCallback } from './pages/auth/AuthCallback'
import { SettingsPage } from './pages/SettingsPage'
import { TerminalPage } from './pages/TerminalPage'
import TelegramAuth from './pages/TelegramAuth'

// Styles
import './styles/theme.css'
import './App.css'

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} terminal-window`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="terminal-content">
            <div className="toast-content">
              <div className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✗'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </div>
              <div className="toast-message">{toast.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const { theme } = useUIStore()

  // Apply theme on mount and when it changes
  React.useEffect(() => {
    document.body.classList.remove('theme-blue', 'theme-green')
    document.body.classList.add(`theme-${theme}`)
    console.log('[App] Theme applied:', theme)
  }, [theme])

  return (
    <Router>
      <AuthProvider>
        <div className="app crt-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/telegram-auth" element={<TelegramAuth />} />

            {/* Protected Routes */}
            {/* Main Terminal Interface (Cursor-style) */}
            <Route
              path="/terminal"
              element={
                <ProtectedRoute>
                  <TerminalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/terminal/:id"
              element={
                <ProtectedRoute>
                  <TerminalPage />
                </ProtectedRoute>
              }
            />
            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy redirects - redirect old routes to terminal */}
            <Route path="/dashboard" element={<Navigate to="/terminal" replace />} />
            <Route path="/chat" element={<Navigate to="/terminal" replace />} />
            <Route path="/chat/:id" element={<Navigate to="/terminal/$1" replace />} />
            <Route path="/generate" element={<Navigate to="/terminal" replace />} />
            <Route path="/generate/:id" element={<Navigate to="/terminal/$1" replace />} />
            <Route path="/review" element={<Navigate to="/terminal" replace />} />
            <Route path="/history" element={<Navigate to="/terminal" replace />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <ToastContainer />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
