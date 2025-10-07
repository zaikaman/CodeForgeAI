import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/theme.css'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bootSequence, setBootSequence] = useState(true)
  const { login, loginWithGithub, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    // Boot sequence animation
    const timer = setTimeout(() => {
      setBootSequence(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Access denied.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGithub()
    } catch (err: any) {
      setError(err.message || 'OAuth authentication failed.')
      setLoading(false)
    }
  }

  if (bootSequence) {
    return (
      <div className="login-page crt-screen full-height flex items-center justify-center">
        <div className="boot-sequence">
          <div className="boot-line phosphor-glow">╔══════════════════════════════════════╗</div>
          <div className="boot-line phosphor-glow">║   CODEFORGE AI AUTHENTICATION SYS   ║</div>
          <div className="boot-line phosphor-glow">║          SYSTEM BOOTING...          ║</div>
          <div className="boot-line phosphor-glow">╚══════════════════════════════════════╝</div>
          <div className="boot-progress mt-lg">
            <div className="boot-progress-bar"></div>
          </div>
          <div className="boot-log mt-md text-muted">
            <div>&gt; Initializing kernel modules...</div>
            <div>&gt; Loading authentication protocols...</div>
            <div>&gt; Establishing secure connection...</div>
            <div>&gt; System ready.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page crt-screen full-height">
      {/* Background Matrix Effect */}
      <div className="matrix-bg"></div>

      {/* Main Login Terminal */}
      <div className="flex items-center justify-center full-height">
        <div className="login-container">
          {/* Terminal Header */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-button close"></div>
              <div className="terminal-button minimize"></div>
              <div className="terminal-button maximize"></div>
              <div className="terminal-title">AUTHENTICATION REQUIRED</div>
            </div>

            <div className="terminal-content">
              {/* ASCII Art Header */}
              <div className="ascii-art phosphor-glow">
                <pre>
{`   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║    ██████╗ ██████╗ ██████╗ ███████╗  ║
   ║   ██╔════╝██╔═══██╗██╔══██╗██╔════╝  ║
   ║   ██║     ██║   ██║██║  ██║█████╗    ║
   ║   ██║     ██║   ██║██║  ██║██╔══╝    ║
   ║   ╚██████╗╚██████╔╝██████╔╝███████╗  ║
   ║    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝  ║
   ║                                       ║
   ║         FORGE AI TERMINAL             ║
   ║         v1.0.0 [SECURE]               ║
   ║                                       ║
   ╚═══════════════════════════════════════╝`}
                </pre>
              </div>

              {/* System Status */}
              <div className="system-status mt-lg mb-lg">
                <div className="status-line">
                  <span className="text-muted">&gt;</span> SYSTEM STATUS:
                  <span className="text-success phosphor-glow"> [ONLINE]</span>
                </div>
                <div className="status-line">
                  <span className="text-muted">&gt;</span> SECURITY LEVEL:
                  <span className="text-warning"> [MAXIMUM]</span>
                </div>
                <div className="status-line">
                  <span className="text-muted">&gt;</span> AUTHENTICATION:
                  <span className="text-error"> [REQUIRED]</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-message terminal-window mt-md mb-md">
                  <div className="terminal-content">
                    <div className="text-error phosphor-glow">
                      ⚠ ERROR: {error}
                    </div>
                    <div className="text-muted mt-sm">
                      &gt; Access denied. Please check your credentials and try again.
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleEmailLogin} className="login-form mt-lg">
                {/* Email Input */}
                <div className="form-group mb-md">
                  <label className="form-label phosphor-glow">
                    &gt; ENTER USER ID:
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">&gt;&gt;</span>
                    <input
                      type="email"
                      className="input terminal-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@codeforge.ai"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group mb-lg">
                  <label className="form-label phosphor-glow">
                    &gt; ENTER ACCESS CODE:
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">&gt;&gt;</span>
                    <input
                      type="password"
                      className="input terminal-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary full-width mb-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="pixel-loader"></span> AUTHENTICATING...
                    </>
                  ) : (
                    '► INITIATE LOGIN SEQUENCE'
                  )}
                </button>

                {/* Divider */}
                <div className="divider mb-md">
                  <span className="divider-text text-muted">OR</span>
                </div>

                {/* OAuth Buttons */}
                <button
                  type="button"
                  onClick={handleGithubLogin}
                  className="btn full-width mb-md oauth-btn"
                  disabled={loading}
                >
                  <span className="oauth-icon">⚡</span> AUTHENTICATE VIA GITHUB
                </button>

                {/* Footer Links */}
                <div className="form-footer mt-lg text-center">
                  <div className="text-muted mb-sm">
                    &gt; New user? <Link to="/signup" className="link-primary phosphor-glow">Register here</Link>
                  </div>
                  <div className="text-muted">
                    &gt; <Link to="/forgot-password" className="link-primary phosphor-glow">Forgot access code?</Link>
                  </div>
                </div>
              </form>

              {/* System Footer */}
              <div className="system-footer mt-xl">
                <div className="footer-line text-muted text-center">
                  ═══════════════════════════════════════
                </div>
                <div className="text-muted text-center mt-sm">
                  CODEFORGE AI © 2025 | SECURE TERMINAL v1.0.0
                </div>
                <div className="text-muted text-center">
                  [ENCRYPTED] [AUTHENTICATED] [MONITORED]
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
