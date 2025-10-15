import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/theme.css';

export default function TelegramAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Telegram account...');
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    completeAuth();
  }, []);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `> ${log}`]);
  };
  
  const completeAuth = async () => {
    try {
      addLog('Initializing Telegram authentication protocol...');
      
      // Get auth token from URL
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (!token) {
        addLog('ERROR: No authentication token found');
        setStatus('error');
        setMessage('Invalid authentication link. Please try again from Telegram.');
        return;
      }
      
      addLog(`Token received: ${token.substring(0, 8)}...`);
      addLog('Verifying user session...');
      
      // Check if user is signed in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addLog('No active session detected');
        addLog('Redirecting to login...');
        // User not signed in - redirect to sign in page with return URL
        const returnUrl = `/telegram-auth?token=${token}`;
        // Store return URL in sessionStorage for after login
        sessionStorage.setItem('telegram_auth_return_url', returnUrl);
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      addLog('Session verified');
      addLog('Establishing secure connection to API...');
      setMessage('Linking your Telegram account...');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      addLog(`API endpoint: ${apiUrl}`);
      
      // Complete the authentication
      const response = await fetch(
        `${apiUrl}/api/telegram/complete-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        }
      );
      
      addLog(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        addLog(`ERROR: ${text.substring(0, 100)}`);
        throw new Error(`API returned ${response.status}: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        addLog(`ERROR: ${data.error}`);
        throw new Error(data.error || 'Failed to link Telegram account');
      }
      
      // Success!
      addLog('Authentication successful!');
      addLog(`Telegram ID: ${data.data?.telegramUser?.telegram_id}`);
      addLog(`Username: @${data.data?.telegramUser?.username || 'N/A'}`);
      addLog('Account linking complete');
      addLog('Redirecting to terminal...');
      
      setStatus('success');
      setMessage('Successfully linked your Telegram account!');
      
      // Redirect to terminal after 3 seconds
      setTimeout(() => {
        navigate('/terminal');
      }, 3000);
      
    } catch (error: any) {
      console.error('Telegram auth error:', error);
      addLog(`FATAL ERROR: ${error.message}`);
      setStatus('error');
      setMessage(error.message || 'Failed to complete authentication');
    }
  };
  
  return (
    <div className="crt-screen auth-page full-height flex items-center justify-center">
      <div className="telegram-auth-container">
        <div className="terminal-window" style={{ maxWidth: '700px', width: '90%' }}>
          <div className="terminal-header">
            <div className="terminal-button close"></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
            <div className="terminal-title">TELEGRAM AUTHENTICATION PROTOCOL</div>
          </div>

          <div className="terminal-content">
            {/* ASCII Art Header */}
            <div className="ascii-art phosphor-glow mb-lg">
              <pre>
{`╔═══════════════════════════════════════════════╗
║                                               ║
║    ████████╗███████╗██╗     ███████╗ ██████╗  ║
║    ╚══██╔══╝██╔════╝██║     ██╔════╝██╔════╝  ║
║       ██║   █████╗  ██║     █████╗  ██║  ███╗ ║
║       ██║   ██╔══╝  ██║     ██╔══╝  ██║   ██║ ║
║       ██║   ███████╗███████╗███████╗╚██████╔╝ ║
║       ╚═╝   ╚══════╝╚══════╝╚══════╝ ╚═════╝  ║
║                                               ║
║         AUTHENTICATION IN PROGRESS            ║
║                                               ║
╚═══════════════════════════════════════════════╝`}
              </pre>
            </div>

            {/* Status Display */}
            <div className="status-section mb-lg">
              <div className="status-line mb-sm">
                <span className="text-muted">&gt;</span> STATUS:
                {status === 'loading' && <span className="text-warning phosphor-glow"> [PROCESSING]</span>}
                {status === 'success' && <span className="text-success phosphor-glow"> [SUCCESS]</span>}
                {status === 'error' && <span className="text-error phosphor-glow"> [ERROR]</span>}
              </div>
              <div className="status-line">
                <span className="text-muted">&gt;</span> {message}
              </div>
            </div>

            {/* Logs Terminal */}
            <div className="terminal-window mb-lg" style={{ background: '#000', border: '1px solid #0f0' }}>
              <div className="terminal-content" style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85em' }}>
                {logs.map((log, i) => (
                  <div key={i} className="text-success" style={{ fontFamily: 'monospace' }}>
                    {log}
                  </div>
                ))}
                {status === 'loading' && (
                  <div className="text-success phosphor-glow" style={{ fontFamily: 'monospace' }}>
                    <span className="pixel-loader"></span> Processing...
                  </div>
                )}
              </div>
            </div>

            {/* Success State */}
            {status === 'success' && (
              <div className="success-section">
                <div className="ascii-check text-success phosphor-glow mb-md">
                  <pre>
{`    ╔═══════════════════════════════════════╗
    ║         ✓  LINK ESTABLISHED          ║
    ║                                       ║
    ║    Telegram account successfully      ║
    ║    linked to CodeForge AI             ║
    ║                                       ║
    ║    You can now use the bot!           ║
    ╚═══════════════════════════════════════╝`}
                  </pre>
                </div>
                <button
                  onClick={() => navigate('/terminal')}
                  className="btn btn-primary full-width mb-sm"
                >
                  &gt; CONTINUE TO TERMINAL
                </button>
                <div className="text-muted text-center mt-sm">
                  &gt; Redirecting automatically in 3 seconds...
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="error-section">
                <div className="ascii-error text-error phosphor-glow mb-md">
                  <pre>
{`    ╔═══════════════════════════════════════╗
    ║         ✗  LINK FAILED               ║
    ║                                       ║
    ║    Authentication could not be        ║
    ║    completed. Please try again.       ║
    ║                                       ║
    ╚═══════════════════════════════════════╝`}
                  </pre>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary full-width mb-sm"
                >
                  &gt; RETRY AUTHENTICATION
                </button>
                <button
                  onClick={() => navigate('/terminal')}
                  className="btn btn-secondary full-width"
                >
                  &gt; RETURN TO TERMINAL
                </button>
              </div>
            )}

            {/* Loading State */}
            {status === 'loading' && (
              <div className="loading-section">
                <div className="progress-bar-container mb-md">
                  <div className="progress-bar">
                    <div className="progress-fill loading-fill"></div>
                  </div>
                </div>
                <div className="text-muted text-center">
                  &gt; Please wait while we establish secure connection...
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="terminal-footer mt-xl">
              <div className="footer-divider text-muted">
                ═══════════════════════════════════════════════
              </div>
              <div className="footer-info text-muted text-center mt-sm">
                <div>&gt; PROTOCOL: Telegram OAuth</div>
                <div>&gt; ENCRYPTION: End-to-End</div>
                <div>&gt; SECURITY: Maximum</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
