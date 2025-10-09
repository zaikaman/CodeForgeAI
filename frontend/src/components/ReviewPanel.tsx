import React, { useState } from 'react'
import '../styles/theme.css'
import './ReviewPanel.css'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  severity: SeverityLevel
  title: string
  description: string
  file: string
  line?: number
  category: string
  suggestion?: string
}

interface ReviewPanelProps {
  findings: Finding[]
  isAnalyzing?: boolean
  className?: string
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  findings,
  isAnalyzing = false,
  className = '',
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'all'>('all')
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  const filteredFindings =
    selectedSeverity === 'all'
      ? findings
      : findings.filter((f) => f.severity === selectedSeverity)

  const severityCounts = {
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
    info: findings.filter((f) => f.severity === 'info').length,
  }

  const getSeverityColor = (severity: SeverityLevel) => {
    const colors = {
      critical: 'severity-critical',
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low',
      info: 'severity-info',
    }
    return colors[severity]
  }

  const getSeverityIcon = (severity: SeverityLevel) => {
    const icons = {
      critical: '✗',
      high: '▲',
      medium: '◆',
      low: '▼',
      info: '◉',
    }
    return icons[severity]
  }

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className={`review-panel terminal-window ${className}`}>
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">CODE REVIEW ANALYSIS</div>
      </div>

      {/* Stats Bar */}
      <div className="review-stats-bar">
        <div className="stats-summary">
          <span className="text-muted">&gt; TOTAL FINDINGS:</span>
          <span className="text-primary phosphor-glow"> {findings.length}</span>
        </div>
        <div className="severity-filters">
          <button
            className={`filter-btn ${selectedSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('all')}
          >
            ALL [{findings.length}]
          </button>
          {(Object.keys(severityCounts) as SeverityLevel[]).map((severity) => (
            <button
              key={severity}
              className={`filter-btn ${getSeverityColor(severity)} ${
                selectedSeverity === severity ? 'active' : ''
              }`}
              onClick={() => setSelectedSeverity(severity)}
            >
              {severity.toUpperCase()} [{severityCounts[severity]}]
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="review-content">
        {isAnalyzing ? (
          <div className="analyzing-state">
            <div className="analyzing-spinner phosphor-glow">◉</div>
            <div className="analyzing-text">ANALYZING CODE...</div>
            <div className="analyzing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="empty-findings">
            <pre className="empty-ascii phosphor-glow">
{`  
                               
           ✓  NO ISSUES        
                               
        CODE REVIEW COMPLETE    
                               `}
            </pre>
            <div className="empty-message text-success mt-md">
              All checks passed! No issues found.
            </div>
          </div>
        ) : (
          <div className="findings-list">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className={`finding-item ${getSeverityColor(finding.severity)} ${
                  expandedFindings.has(finding.id) ? 'expanded' : ''
                }`}
              >
                <div className="finding-header" onClick={() => toggleFinding(finding.id)}>
                  <div className="finding-severity">
                    <span className="severity-icon phosphor-glow">
                      {getSeverityIcon(finding.severity)}
                    </span>
                    <span className="severity-label">[{finding.severity.toUpperCase()}]</span>
                  </div>
                  <div className="finding-title">{finding.title}</div>
                  <div className="finding-expand">
                    {expandedFindings.has(finding.id) ? '▼' : '►'}
                  </div>
                </div>

                {expandedFindings.has(finding.id) && (
                  <div className="finding-details">
                    <div className="detail-row">
                      <span className="detail-label text-muted">&gt; CATEGORY:</span>
                      <span className="detail-value">{finding.category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label text-muted">&gt; FILE:</span>
                      <span className="detail-value">{finding.file}</span>
                      {finding.line && (
                        <span className="detail-value text-warning">:Line {finding.line}</span>
                      )}
                    </div>
                    <div className="detail-description mt-sm">{finding.description}</div>
                    {finding.suggestion && (
                      <div className="detail-suggestion mt-sm">
                        <div className="suggestion-label text-success phosphor-glow">
                          ► SUGGESTION:
                        </div>
                        <div className="suggestion-text">{finding.suggestion}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
