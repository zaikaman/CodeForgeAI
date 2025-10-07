import React from 'react'
import './StatusIndicator.css'

export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning'

interface StatusIndicatorProps {
  status: StatusType
  message?: string
  className?: string
  size?: 'small' | 'medium' | 'large'
  showIcon?: boolean
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className = '',
  size = 'medium',
  showIcon = true,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return '◉'
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warning':
        return '⚠'
      case 'idle':
      default:
        return '○'
    }
  }

  const getStatusAnimation = () => {
    switch (status) {
      case 'loading':
        return 'pulse-glow'
      case 'success':
        return 'flash-success'
      case 'error':
        return 'glitch-error'
      case 'warning':
        return 'blink-warning'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'status-loading'
      case 'success':
        return 'status-success'
      case 'error':
        return 'status-error'
      case 'warning':
        return 'status-warning'
      default:
        return 'status-idle'
    }
  }

  return (
    <div
      className={`status-indicator ${getStatusColor()} ${getStatusAnimation()} size-${size} ${className}`}
    >
      {showIcon && (
        <span className="status-icon phosphor-glow">{getStatusIcon()}</span>
      )}
      {message && <span className="status-message">{message}</span>}
    </div>
  )
}

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ text?: string; className?: string }> = ({
  text = 'PROCESSING',
  className = '',
}) => {
  return (
    <div className={`loading-spinner ${className}`}>
      <div className="spinner-container">
        <div className="pixel-spinner"></div>
        <div className="spinner-text phosphor-glow">{text}...</div>
      </div>
      <div className="spinner-dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  )
}

// Progress Bar Component
interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  className = '',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={`progress-bar-container ${className}`}>
      {label && (
        <div className="progress-label phosphor-glow">
          &gt; {label}
          {showPercentage && <span className="progress-percentage"> [{clampedProgress}%]</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill phosphor-glow"
          style={{ width: `${clampedProgress}%` }}
        >
          <div className="progress-bar-glow"></div>
        </div>
      </div>
    </div>
  )
}

// System Status Panel
interface SystemStatusProps {
  agentStatus: string
  connectionStatus: 'online' | 'offline' | 'connecting'
  queueSize?: number
  className?: string
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  agentStatus,
  connectionStatus,
  queueSize = 0,
  className = '',
}) => {
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'online':
        return 'text-success'
      case 'offline':
        return 'text-error'
      case 'connecting':
        return 'text-warning'
      default:
        return 'text-muted'
    }
  }

  return (
    <div className={`system-status-panel terminal-window ${className}`}>
      <div className="terminal-content">
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label text-muted">&gt; AGENT STATUS:</span>
            <span className="status-value text-primary phosphor-glow">{agentStatus}</span>
          </div>
          <div className="status-item">
            <span className="status-label text-muted">&gt; CONNECTION:</span>
            <span className={`status-value ${getConnectionColor()} phosphor-glow`}>
              [{connectionStatus.toUpperCase()}]
            </span>
          </div>
          {queueSize > 0 && (
            <div className="status-item">
              <span className="status-label text-muted">&gt; QUEUE:</span>
              <span className="status-value text-warning phosphor-glow">{queueSize} tasks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Retro Loading Animation (Matrix-style)
export const RetroLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`retro-loader ${className}`}>
      <div className="loader-frame">
        <pre className="loader-ascii phosphor-glow">
{`╔════════════════════════╗
║                        ║
║    [▓▓▓▓▓▓▓░░░░░░░]   ║
║                        ║
║    PROCESSING...       ║
║                        ║
╚════════════════════════╝`}
        </pre>
      </div>
    </div>
  )
}
