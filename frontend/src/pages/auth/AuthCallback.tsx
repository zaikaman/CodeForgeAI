import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../../styles/theme.css'
import './AuthCallback.css'

export const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Verifying authentication...')
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        if (error) {
          throw new Error(errorDescription || 'OAuth authentication failed')
        }

        if (accessToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            throw sessionError
          }

          if (data.session) {
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')

            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard')
            }, 1500)
          } else {
            throw new Error('Failed to establish session')
          }
        } else {
          // Try to get session from supabase (in case of page refresh)
          const { data, error: sessionError } = await supabase.auth.getSession()

          if (sessionError || !data.session) {
            throw new Error('No valid session found')
          }

          setStatus('success')
          setMessage('Session restored! Redirecting...')

          setTimeout(() => {
            navigate('/dashboard')
          }, 1500)
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage(err.message || 'Authentication failed')

        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="auth-callback crt-screen full-height flex items-center justify-center">
      <div className="callback-container">
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-button close"></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
            <div className="terminal-title">AUTHENTICATION PROTOCOL</div>
          </div>

          <div className="terminal-content text-center">
            {/* Processing Status */}
            {status === 'processing' && (
              <div className="processing-state">
                <div className="ascii-spinner phosphor-glow">
                  <pre>
{`    ╔═══════════════════════════╗
    ║                           ║
    ║    [▓▓▓▓▓▓▓▓░░░░░░░░]    ║
    ║                           ║
    ║   PROCESSING OAUTH...     ║
    ║                           ║
    ╚═══════════════════════════╝`}
                  </pre>
                </div>
                <div className="status-message mt-lg phosphor-glow">
                  {message}
                </div>
                <div className="loading-dots mt-md">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}

            {/* Success Status */}
            {status === 'success' && (
              <div className="success-state">
                <div className="ascii-check phosphor-glow text-success">
                  <pre>
{`    ╔═══════════════════════════╗
    ║                           ║
    ║         ✓  SUCCESS        ║
    ║                           ║
    ║   AUTHENTICATION VALID    ║
    ║                           ║
    ║   ACCESS GRANTED          ║
    ║                           ║
    ╚═══════════════════════════╝`}
                  </pre>
                </div>
                <div className="status-message mt-lg text-success phosphor-glow">
                  {message}
                </div>
                <div className="progress-bar mt-md">
                  <div className="progress-fill success-fill"></div>
                </div>
              </div>
            )}

            {/* Error Status */}
            {status === 'error' && (
              <div className="error-state">
                <div className="ascii-error phosphor-glow text-error">
                  <pre>
{`    ╔═══════════════════════════╗
    ║                           ║
    ║         ✗  ERROR          ║
    ║                           ║
    ║   AUTHENTICATION FAILED   ║
    ║                           ║
    ║   ACCESS DENIED           ║
    ║                           ║
    ╚═══════════════════════════╝`}
                  </pre>
                </div>
                <div className="status-message mt-lg text-error phosphor-glow">
                  {message}
                </div>
                <div className="error-details mt-md text-muted">
                  &gt; Redirecting to login screen...
                </div>
              </div>
            )}

            {/* System Info Footer */}
            <div className="system-info mt-xl">
              <div className="info-divider text-muted">
                ═══════════════════════════════════════
              </div>
              <div className="info-lines text-muted mt-sm">
                <div>&gt; PROTOCOL: OAuth 2.0</div>
                <div>&gt; ENCRYPTION: AES-256</div>
                <div>&gt; STATUS: {status.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
