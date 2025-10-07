import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/theme.css'
import './SignupPage.css'

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initSequence, setInitSequence] = useState(true)
  const { signup, loginWithGithub, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitSequence(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Access codes do not match. Please verify.')
      return
    }

    if (password.length < 8) {
      setError('Access code must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      await signup(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignup = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGithub()
    } catch (err: any) {
      setError(err.message || 'OAuth registration failed.')
      setLoading(false)
    }
  }

  if (initSequence) {
    return (
      <div className="signup-page crt-screen full-height flex items-center justify-center">
        <div className="init-sequence">
          <div className="init-line phosphor-glow">╔══════════════════════════════════════╗</div>
          <div className="init-line phosphor-glow">║  USER REGISTRATION PROTOCOL ACTIVE  ║</div>
          <div className="init-line phosphor-glow">║     INITIALIZING SECURE SESSION     ║</div>
          <div className="init-line phosphor-glow">╚══════════════════════════════════════╝</div>
          <div className="init-spinner mt-lg">
            <div className="spinner-text phosphor-glow">LOADING...</div>
            <div className="spinner-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page crt-screen full-height">
      <div className="matrix-bg"></div>

      <div className="flex items-center justify-center full-height">
        <div className="signup-container">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-button close"></div>
              <div className="terminal-button minimize"></div>
              <div className="terminal-button maximize"></div>
              <div className="terminal-title">NEW USER REGISTRATION</div>
            </div>

            <div className="terminal-content">
              {/* ASCII Art Header */}
              <div className="ascii-art phosphor-glow">
                <pre>
{`   ╔═══════════════════════════════════════╗
   ║    ██████╗ ███████╗ ██████╗ ██╗███╗   ║
   ║    ██╔══██╗██╔════╝██╔════╝ ██║████╗  ║
   ║    ██████╔╝█████╗  ██║  ███╗██║██╔██╗ ║
   ║    ██╔══██╗██╔══╝  ██║   ██║██║██║╚██╗║
   ║    ██║  ██║███████╗╚██████╔╝██║██║ ╚═╝║
   ║    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚═╝    ║
   ║                                       ║
   ║      CREATE NEW OPERATOR ACCOUNT      ║
   ║                                       ║
   ╚═══════════════════════════════════════╝`}
                </pre>
              </div>

              {/* Registration Instructions */}
              <div className="registration-info mt-lg mb-lg">
                <div className="info-line">
                  <span className="text-primary">&gt;</span> WELCOME TO CODEFORGE AI
                </div>
                <div className="info-line text-muted">
                  <span className="text-primary">&gt;</span> Please provide credentials to create operator account
                </div>
                <div className="info-line text-muted">
                  <span className="text-primary">&gt;</span> All data encrypted with military-grade security
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-message terminal-window mt-md mb-md">
                  <div className="terminal-content">
                    <div className="text-error phosphor-glow">
                      ⚠ REGISTRATION ERROR: {error}
                    </div>
                  </div>
                </div>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSignup} className="signup-form mt-lg">
                {/* Email Input */}
                <div className="form-group mb-md">
                  <label className="form-label phosphor-glow">
                    &gt; OPERATOR ID (EMAIL):
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">&gt;&gt;</span>
                    <input
                      type="email"
                      className="input terminal-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@codeforge.ai"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group mb-md">
                  <label className="form-label phosphor-glow">
                    &gt; CREATE ACCESS CODE (MIN 8 CHARS):
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
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="password-strength mt-sm">
                      <div className="strength-bar">
                        <div
                          className={`strength-fill ${
                            password.length < 8
                              ? 'weak'
                              : password.length < 12
                              ? 'medium'
                              : 'strong'
                          }`}
                          style={{
                            width: `${Math.min((password.length / 16) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="strength-text text-muted">
                        STRENGTH:{' '}
                        {password.length < 8
                          ? '[WEAK]'
                          : password.length < 12
                          ? '[MEDIUM]'
                          : '[STRONG]'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="form-group mb-lg">
                  <label className="form-label phosphor-glow">
                    &gt; CONFIRM ACCESS CODE:
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">&gt;&gt;</span>
                    <input
                      type="password"
                      className="input terminal-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <div className="text-error mt-sm">
                      ⚠ Access codes do not match
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary full-width mb-md"
                  disabled={loading || password !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <span className="pixel-loader"></span> CREATING ACCOUNT...
                    </>
                  ) : (
                    '► CREATE OPERATOR ACCOUNT'
                  )}
                </button>

                {/* Divider */}
                <div className="divider mb-md">
                  <span className="divider-text text-muted">OR</span>
                </div>

                {/* OAuth Buttons */}
                <button
                  type="button"
                  onClick={handleGithubSignup}
                  className="btn full-width mb-md oauth-btn"
                  disabled={loading}
                >
                  <span className="oauth-icon">⚡</span> REGISTER VIA GITHUB
                </button>

                {/* Terms & Conditions */}
                <div className="terms-box mt-md mb-md">
                  <div className="text-muted">
                    <span className="text-primary">&gt;</span> By creating an account, you agree to:
                  </div>
                  <ul className="terms-list text-muted">
                    <li>Terms of Service</li>
                    <li>Privacy Policy</li>
                    <li>Code of Conduct</li>
                  </ul>
                </div>

                {/* Footer Links */}
                <div className="form-footer mt-lg text-center">
                  <div className="text-muted">
                    &gt; Already registered? <Link to="/login" className="link-primary phosphor-glow">Login here</Link>
                  </div>
                </div>
              </form>

              {/* System Footer */}
              <div className="system-footer mt-xl">
                <div className="footer-line text-muted text-center">
                  ═══════════════════════════════════════
                </div>
                <div className="text-muted text-center mt-sm">
                  CODEFORGE AI © 2025 | SECURE REGISTRATION v1.0.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
