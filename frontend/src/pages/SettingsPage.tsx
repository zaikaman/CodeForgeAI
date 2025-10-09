import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../stores/uiStore'
import apiClient from '../services/apiClient'
import '../styles/theme.css'
import './SettingsPage.css'

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { theme, setTheme, showToast } = useUIStore()
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [preferences, setPreferences] = useState({
    crtEffects: true,
    phosphorGlow: true,
    autoScrollChat: true,
    soundEffects: false,
  })
  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSettings()

      if (response.data) {
        setHasApiKey(response.data.hasApiKey || false)
        
        // Load theme from backend
        if (response.data.theme) {
          setTheme(response.data.theme)
        }
        
        setPreferences({
          crtEffects: response.data.crtEffects ?? true,
          phosphorGlow: response.data.phosphorGlow ?? true,
          autoScrollChat: response.data.autoScrollChat ?? true,
          soundEffects: response.data.soundEffects ?? false,
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleThemeToggle = async () => {
    const newTheme = theme === 'blue' ? 'green' : 'blue'
    setTheme(newTheme)
    const themeName = newTheme === 'blue' ? 'BLUE MODE' : 'GREEN PHOSPHOR'
    
    try {
      await apiClient.updatePreferences({ theme: newTheme })
      showToast('success', `Theme changed to ${themeName}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save theme')
    }
  }

  const handleThemeSelect = async (selectedTheme: 'blue' | 'green') => {
    setTheme(selectedTheme)
    const themeName = selectedTheme === 'blue' ? 'BLUE MODE' : 'GREEN PHOSPHOR'
    
    try {
      await apiClient.updatePreferences({ theme: selectedTheme })
      showToast('success', `Theme changed to ${themeName}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save theme')
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return

    try {
      await apiClient.updateApiKey(apiKey)
      setHasApiKey(true)
      setApiKey('')
      showToast('success', 'API key saved successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save API key')
    }
  }

  const handlePreferenceChange = async (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    }

    setPreferences(newPreferences)

    try {
      await apiClient.updatePreferences({ [key]: newPreferences[key] })
      showToast('success', 'Preferences updated')
    } catch (error: any) {
      // Revert on error
      setPreferences(preferences)
      showToast('error', error.message || 'Failed to update preferences')
    }
  }

  const handleClearData = async () => {
    if (confirm('Clear all cached data? This cannot be undone.')) {
      try {
        await apiClient.deleteSettings()
        showToast('success', 'Data cleared successfully')
        loadSettings()
      } catch (error: any) {
        showToast('error', error.message || 'Failed to clear data')
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="settings-page">
          <div className="terminal-window">
            <div className="terminal-content">
              <p className="text-muted">&gt; Loading settings...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="settings-page">
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
          </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="settings-section terminal-window">
          <div className="terminal-content">
            <h2 className="section-title phosphor-glow">◆ DISPLAY THEME</h2>

            <div className="theme-preview mt-md">
              <div className="theme-option">
                <div className="theme-sample blue-theme">
                  <div className="sample-text phosphor-glow">BLUE MODE</div>
                  <div className="sample-bar"></div>
                </div>
                <button
                  className={`btn ${theme === 'blue' ? 'btn-primary' : ''}`}
                  onClick={() => handleThemeSelect('blue')}
                  disabled={theme === 'blue'}
                >
                  {theme === 'blue' ? '◉ ACTIVE' : 'SELECT'}
                </button>
              </div>

              <div className="theme-option mt-md">
                <div className="theme-sample green-theme">
                  <div className="sample-text phosphor-glow">GREEN PHOSPHOR</div>
                  <div className="sample-bar"></div>
                </div>
                <button
                  className={`btn ${theme === 'green' ? 'btn-primary' : ''}`}
                  onClick={() => handleThemeSelect('green')}
                  disabled={theme === 'green'}
                >
                  {theme === 'green' ? '◉ ACTIVE' : 'SELECT'}
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
                  placeholder={hasApiKey ? '••••••••••••••' : 'sk-...'}
                />
              </div>
              <div className="setting-hint text-muted mt-sm">
                &gt; Required for code generation. Keys are encrypted.
                {hasApiKey && ' (Current key saved)'}
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
                  <input
                    type="checkbox"
                    checked={preferences.crtEffects}
                    onChange={() => handlePreferenceChange('crtEffects')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">PHOSPHOR GLOW</div>
                  <div className="preference-desc text-muted">Text glow effects</div>
                </div>
                <label className="preference-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.phosphorGlow}
                    onChange={() => handlePreferenceChange('phosphorGlow')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">AUTO-SCROLL CHAT</div>
                  <div className="preference-desc text-muted">Automatically scroll agent messages</div>
                </div>
                <label className="preference-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.autoScrollChat}
                    onChange={() => handlePreferenceChange('autoScrollChat')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item mt-md">
                <div className="preference-info">
                  <div className="preference-title">SOUND EFFECTS</div>
                  <div className="preference-desc text-muted">Terminal sound effects</div>
                </div>
                <label className="preference-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.soundEffects}
                    onChange={() => handlePreferenceChange('soundEffects')}
                  />
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
                <button className="btn btn-danger mt-sm" onClick={handleClearData}>
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
    </Layout>
  )
}
