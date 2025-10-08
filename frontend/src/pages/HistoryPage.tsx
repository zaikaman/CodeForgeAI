import React, { useState } from 'react'
import { Layout } from '../components/Layout'
import { useGenerationStore } from '../stores/generationStore'
import { CodePreview } from '../components/CodeEditor'
import { Link } from 'react-router-dom'
import '../styles/theme.css'
import './HistoryPage.css'

export const HistoryPage: React.FC = () => {
  const { history, removeFromHistory, clearHistory } = useGenerationStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedGeneration = history.find((h) => h.id === selectedId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success'
      case 'error':
        return 'text-error'
      case 'generating':
        return 'text-warning'
      default:
        return 'text-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓'
      case 'error':
        return '✗'
      case 'generating':
        return '◉'
      default:
        return '○'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Layout>
      <div className="history-page">
      {/* Header */}
      <div className="page-header terminal-window">
        <div className="terminal-header">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
          <div className="terminal-title">GENERATION HISTORY</div>
        </div>
        <div className="terminal-content">
          <div className="header-content">
            <div>
              <h1 className="page-title phosphor-glow">◆ CODE GENERATION LOG</h1>
              <p className="page-description">&gt; Review past generations and results</p>
            </div>
            {history.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Clear all history?')) {
                    clearHistory()
                    setSelectedId(null)
                  }
                }}
              >
                CLEAR ALL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="history-stats terminal-window">
        <div className="terminal-content">
          <div className="stats-row">
            <div className="stat-item">
              <span className="text-muted">&gt; TOTAL:</span>
              <span className="text-primary phosphor-glow"> {history.length}</span>
            </div>
            <div className="stat-item">
              <span className="text-muted">&gt; COMPLETED:</span>
              <span className="text-success">
                {' '}
                {history.filter((h) => h.status === 'completed').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="text-muted">&gt; FAILED:</span>
              <span className="text-error">
                {' '}
                {history.filter((h) => h.status === 'error').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-history terminal-window">
          <div className="terminal-content">
            <pre className="empty-ascii phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      NO GENERATION HISTORY        ║
    ║                                   ║
    ║   ► Start generating code         ║
    ║   ► History will appear here      ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
            </pre>
            <Link to="/generate" className="btn btn-primary mt-lg">
              ► START GENERATING
            </Link>
          </div>
        </div>
      ) : (
        <div className="history-grid">
          {/* History List */}
          <div className="history-list terminal-window">
            <div className="terminal-content">
              <h3 className="section-title phosphor-glow">◆ TIMELINE</h3>
              <div className="timeline mt-md">
                {history.map((gen) => (
                  <div
                    key={gen.id}
                    className={`timeline-item ${selectedId === gen.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(gen.id)}
                  >
                    <div className="timeline-marker">
                      <span className={`timeline-icon ${getStatusColor(gen.status)}`}>
                        {getStatusIcon(gen.status)}
                      </span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{gen.prompt.substring(0, 60)}...</div>
                      <div className="timeline-meta">
                        <span className="text-muted">
                          {new Date(gen.startedAt).toLocaleString()}
                        </span>
                        {gen.duration && (
                          <span className="text-muted">
                            {' '}
                            • {formatDuration(gen.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="history-details">
            {selectedGeneration ? (
              <>
                <div className="details-header terminal-window">
                  <div className="terminal-content">
                    <div className="details-header-content">
                      <div>
                        <h3 className="details-title phosphor-glow">GENERATION DETAILS</h3>
                        <div className={`details-status ${getStatusColor(selectedGeneration.status)}`}>
                          {getStatusIcon(selectedGeneration.status)} {selectedGeneration.status.toUpperCase()}
                        </div>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          removeFromHistory(selectedGeneration.id)
                          setSelectedId(null)
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="details-content terminal-window mt-md">
                  <div className="terminal-content">
                    <div className="details-section">
                      <h4 className="details-section-title phosphor-glow">&gt; PROMPT:</h4>
                      <p className="details-text">{selectedGeneration.prompt}</p>
                    </div>

                    {selectedGeneration.request.projectContext && (
                      <div className="details-section mt-md">
                        <h4 className="details-section-title phosphor-glow">&gt; CONTEXT:</h4>
                        <p className="details-text">{selectedGeneration.request.projectContext}</p>
                      </div>
                    )}

                    <div className="details-section mt-md">
                      <h4 className="details-section-title phosphor-glow">&gt; CONFIGURATION:</h4>
                      <div className="config-grid">
                        <div className="config-item">
                          <span className="text-muted">Language:</span>
                          <span className="text-primary">
                            {selectedGeneration.request.targetLanguage.toUpperCase()}
                          </span>
                        </div>
                        <div className="config-item">
                          <span className="text-muted">Complexity:</span>
                          <span className="text-primary">
                            {selectedGeneration.request.complexity.toUpperCase()}
                          </span>
                        </div>
                        <div className="config-item">
                          <span className="text-muted">Tests:</span>
                          <span className="text-primary">
                            {selectedGeneration.request.includeTests ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="config-item">
                          <span className="text-muted">Docs:</span>
                          <span className="text-primary">
                            {selectedGeneration.request.includeDocumentation ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedGeneration.response?.code && (
                      <div className="details-section mt-md">
                        <h4 className="details-section-title phosphor-glow">&gt; GENERATED CODE:</h4>
                        <CodePreview
                          code={selectedGeneration.response.code}
                          language={selectedGeneration.request.targetLanguage}
                          maxLines={15}
                          className="mt-sm"
                        />
                      </div>
                    )}

                    {selectedGeneration.error && (
                      <div className="details-section mt-md">
                        <h4 className="details-section-title text-error">&gt; ERROR:</h4>
                        <p className="details-text text-error">{selectedGeneration.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection terminal-window">
                <div className="terminal-content">
                  <div className="text-center text-muted">
                    &gt; Select a generation from the timeline to view details
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
