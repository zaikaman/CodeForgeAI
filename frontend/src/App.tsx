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
import { DashboardPage } from './pages/DashboardPage'
import { GeneratePage } from './pages/GeneratePage'
import { ReviewPage } from './pages/ReviewPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

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

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <GeneratePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

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
