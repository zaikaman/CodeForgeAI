import React from 'react'
import { useUIStore } from '../stores/uiStore'
import apiClient from '../services/apiClient'
import './ThemeSwitcher.css'

interface ThemeSwitcherProps {
  variant?: 'default' | 'compact'
  showLabel?: boolean
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  variant = 'default',
  showLabel = true 
}) => {
  const { theme, setTheme, showToast } = useUIStore()

  const handleThemeToggle = async () => {
    const newTheme = theme === 'blue' ? 'green' : 'blue'
    setTheme(newTheme)
    const themeName = newTheme === 'blue' ? 'BLUE MODE' : 'GREEN PHOSPHOR'
    
    try {
      await apiClient.updatePreferences({ theme: newTheme })
      showToast('success', `Theme changed to ${themeName}`)
    } catch (error: any) {
      // Silent fail for unauthenticated users
      console.log('Theme change (local only):', themeName)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        className="theme-switcher-compact"
        onClick={handleThemeToggle}
        title={`Switch to ${theme === 'blue' ? 'Green Phosphor' : 'Blue Mode'}`}
      >
        <span className={`theme-icon phosphor-glow ${theme === 'blue' ? 'blue-icon' : 'green-icon'}`}>
          {theme === 'blue' ? '◆' : '◈'}
        </span>
        {showLabel && (
          <span className="theme-label">
            {theme === 'blue' ? 'BLUE' : 'GREEN'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="theme-switcher">
      <button
        className="theme-switcher-btn"
        onClick={handleThemeToggle}
      >
        <span className="theme-switcher-icon phosphor-glow">
          {theme === 'blue' ? '◆' : '◈'}
        </span>
        <span className="theme-switcher-text">
          {theme === 'blue' ? 'BLUE MODE' : 'GREEN PHOSPHOR'}
        </span>
        <span className="theme-switcher-arrow">►</span>
      </button>
    </div>
  )
}
