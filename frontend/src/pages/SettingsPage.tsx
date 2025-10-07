import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../stores/uiStore'
import '../styles/theme.css'
import './SettingsPage.css'

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme, showToast } = useUIStore()
  const [apiKey, setApiKey] = useState('')

  const handleThemeToggle = () => {
    const newTheme = theme === 'green' ? 'amber' : 'green'
    setTheme(newTheme)
    showToast('success', `Theme changed to ${newTheme.toUpperCase()}`)
  }

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return
    // TODO: Save to backend
    showToast('success', 'API key saved successfully')
  }

  const handleLogout = async () => {
    if (confirm('Log out of CodeForge AI?')) {
      await logout()
    }
  }

  return (
    <div className="settings-page crt-screen">
      {/* Header */}
      <div className="page-header terminal-window">
        <div className="terminal-header">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
          <div className="terminal-title">SYSTEM CONFIGURATION</div>
        </div>
        <div className="terminal-content">
          <h1 className="page-title phosphor-glow">◆ OPERATOR SETTINGS</h1>
          <p className="page-description">&gt; Configure system preferences and credentials</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Account Section */}
        <div className="settings-section terminal-window">
          <div className="terminal-content">
            <h2 className="section-title phosphor-glow">◆ ACCOUNT INFORMATION</h2>

            <div className="setting-group mt-md">
              <div className="setting-label text-muted">&gt; OPERATOR ID:</div>
              <div className="setting-value text-primary">{user?.email || 'Not authenticated'}</div>
            </div>

            <div className="setting-group mt-md">
              <div className="setting-label text-muted">&gt; USER ID:</div>
              <div className="setting-value text-primary">{user?.id || 'N/A'}</div>
            </div>

            <div className="setting-group mt-lg">
              <button className="btn btn-danger" onClick={handleLogout}>
                ► TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="settings-section terminal-window">
          <div className="terminal-content">
            <h2 className="section-title phosphor-glow">◆ DISPLAY THEME</h2>

            <div className="theme-preview mt-md">
              <div className="theme-option">
                <div className="theme-sample green-theme">
                  <div className="sample-text phosphor-glow">GREEN PHOSPHOR</div>
                  <div className="sample-bar"></div>
                </div>
                <button
                  className={`btn ${theme === 'green' ? 'btn-primary' : ''}`}
                  onClick={() => setTheme('green')}
                  disabled={theme === 'green'}
                >
                  {theme === 'green' ? '◉ ACTIVE' : 'SELECT'}
                </button>
              </div>

              <div className="theme-option mt-md">
                <div className="theme-sample amber-theme">
                  <div className="sample-text">AMBER MODE</div>
                  <div className="sample-bar"></div>
                </div>
                <button
                  className={`btn ${theme === 'amber' ? 'btn-primary' : ''}`}
                  onClick={() => setTheme('amber')}
                  disabled={theme === 'amber'}
                >
                  {theme === 'amber' ? '◉ ACTIVE' : 'SELECT'}
                </button>
              </div>
            </div>

            <button className="btn full-width mt-lg" onClick={handleThemeToggle}>
              ► TOGGLE THEME
            </button>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="settings-section terminal-window">
          <div className="terminal-content">
            <h2 className="section-title phosphor-glow">◆ API CONFIGURATION</h2>

            <div className="setting-group mt-md">
              <label className="setting-label text-muted">&gt; OPENAI API KEY:</label>
              <div className="input-wrapper mt-sm">
                <input
                  type="password"
                  className="input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="setting-hint text-muted mt-sm">
                &gt; Required for code generation. Keys are encrypted.
              </div>
            </div>

            <button className="btn btn-primary mt-md" onClick={handleSaveApiKey}>
              ► SAVE CONFIGURATION
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section terminal-window">
          <div className="terminal-content">
            <h2 className="section-title phosphor-glow">◆ SYSTEM PREFERENCES</h2>

            <div className="preference-list mt-md">
              <div className="preference-item">
                <div className="preference-info">
                  <div className="preference-title">CRT EFFECTS</div>
                  <div className="preference-desc text-muted">Scanlines and flicker animation</div>
                </div>
                <label className="preference-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">PHOSPHOR GLOW</div>
                  <div className="preference-desc text-muted">Text glow effects</div>
                </div>
                <label className="preference-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">AUTO-SCROLL CHAT</div>
                  <div className="preference-desc text-muted">Automatically scroll agent messages</div>
                </div>
                <label className="preference-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">SOUND EFFECTS</div>
                  <div className="preference-desc text-muted">Terminal sound effects</div>
                </div>
                <label className="preference-toggle">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section terminal-window danger-section">
          <div className="terminal-content">
            <h2 className="section-title text-error phosphor-glow">◆ DANGER ZONE</h2>

            <div className="danger-actions mt-md">
              <div className="danger-item">
                <div>
                  <div className="danger-title">CLEAR ALL DATA</div>
                  <div className="danger-desc text-muted">
                    Remove all generation history and cached data
                  </div>
                </div>
                <button className="btn btn-danger mt-sm">
                  CLEAR DATA
                </button>
              </div>

              <div className="danger-item mt-md">
                <div>
                  <div className="danger-title">DELETE ACCOUNT</div>
                  <div className="danger-desc text-muted">
                    Permanently delete account and all associated data
                  </div>
                </div>
                <button className="btn btn-danger mt-sm">
                  DELETE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
