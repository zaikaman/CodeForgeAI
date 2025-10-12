import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Header.css'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (confirm('Log out of CodeForge AI?')) {
      try {
        await signOut()
        navigate('/')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="app-header terminal-window">
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">CODEFORGE AI - NAVIGATION CONSOLE</div>
      </div>
      <div className="terminal-content">
        <div className="header-content">
          {/* Logo/Brand */}
          <div className="header-brand">
            <Link to="/dashboard" className="brand-link">
              <span className="brand-icon phosphor-glow">◆</span>
              <span className="brand-text">CODEFORGE</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="header-nav">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              ◆ DASHBOARD
            </Link>
            <Link 
              to="/chat" 
              className={`nav-link ${(isActive('/chat') || location.pathname.startsWith('/chat/')) ? 'active' : ''}`}
            >
              🤖 AI CHAT
            </Link>
            <Link 
              to="/generate" 
              className={`nav-link ${isActive('/generate') ? 'active' : ''}`}
            >
              ► GENERATE
            </Link>
            <Link 
              to="/review" 
              className={`nav-link ${isActive('/review') ? 'active' : ''}`}
            >
              ◉ REVIEW
            </Link>
            <Link 
              to="/history" 
              className={`nav-link ${isActive('/history') ? 'active' : ''}`}
            >
              ▣ HISTORY
            </Link>
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
            >
              ⚙ SETTINGS
            </Link>
          </nav>

          {/* User Actions */}
          <div className="header-actions">
            <div className="user-info">
              <span className="user-email text-muted">{user?.email}</span>
            </div>
            <button 
              className="btn btn-danger logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              ► LOGOUT
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}