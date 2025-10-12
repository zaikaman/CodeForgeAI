import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { MatrixBackground } from '../../components/MatrixBackground'
import '../../styles/theme.css'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bootSequence, setBootSequence] = useState(true)
  const { signInWithGithub, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/terminal')
    }
  }, [user, navigate])

  useEffect(() => {
    // Boot sequence animation
    const timer = setTimeout(() => {
      setBootSequence(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleGithubLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGithub()
    } catch (err: any) {
      setError(err.message || 'OAuth authentication failed.')
      setLoading(false)
    }
  }

  if (bootSequence) {
    return (
      <div className="login-page crt-screen auth-page full-height flex items-center justify-center">
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
    <div className="login-page crt-screen auth-page full-height">
      {/* Background Matrix Effect */}
      <MatrixBackground />

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
   ║    ██████╗ ██████╗ ██████╗ ███████╗   ║
   ║   ██╔════╝██╔═══██╗██╔══██╗██╔════╝   ║
   ║   ██║     ██║   ██║██║  ██║█████╗     ║
   ║   ██║     ██║   ██║██║  ██║██╔══╝     ║
   ║   ╚██████╗╚██████╔╝██████╔╝███████╗   ║
   ║    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝   ║
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
                      &gt; Access denied. Please try again.
                    </div>
                  </div>
                </div>
              )}

              {/* Authentication Instructions */}
              <div className="auth-instructions mt-lg mb-lg">
                <div className="text-muted mb-md">
                  &gt; AUTHENTICATION METHOD:
                </div>
                <div className="phosphor-glow mb-md">
                  Connect your GitHub account to access CodeForge AI
                </div>
                <div className="text-muted text-sm">
                  ⚡ Instant access with your GitHub credentials<br/>
                  🔐 Secure OAuth 2.0 authentication<br/>
                  🚀 No additional registration required
                </div>
              </div>

              {/* GitHub OAuth Button */}
              <div className="login-form mt-lg">
                <button
                  type="button"
                  onClick={handleGithubLogin}
                  className="btn btn-primary full-width mb-md oauth-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="pixel-loader"></span> AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      <span className="oauth-icon">⚡</span> AUTHENTICATE VIA GITHUB
                    </>
                  )}
                </button>

                {/* Info Text */}
                <div className="form-footer mt-lg text-center">
                  <div className="text-muted text-sm">
                    &gt; By authenticating, you agree to our Terms of Service
                  </div>
                </div>
              </div>

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
