import React from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import '../styles/theme.css'
import './DiffViewer.css'

interface DiffViewerProps {
  oldCode: string
  newCode: string
  oldTitle?: string
  newTitle?: string
  language?: string
  splitView?: boolean
  className?: string
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldCode,
  newCode,
  oldTitle = 'ORIGINAL',
  newTitle = 'MODIFIED',
  language = 'typescript',
  splitView = true,
  className = '',
}) => {
  // Custom styles for retro terminal theme
  const customStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#0a0e0f',
        diffViewerColor: '#00ff41',
        addedBackground: '#00441a',
        addedColor: '#33ff66',
        removedBackground: '#441a1a',
        removedColor: '#ff6666',
        wordAddedBackground: '#006619',
        wordRemovedBackground: '#661919',
        addedGutterBackground: '#003311',
        removedGutterBackground: '#331111',
        gutterBackground: '#141a1c',
        gutterBackgroundDark: '#0a0e0f',
        highlightBackground: '#1a2224',
        highlightGutterBackground: '#1a2224',
        codeFoldGutterBackground: '#141a1c',
        codeFoldBackground: '#0a0e0f',
        emptyLineBackground: '#0a0e0f',
        gutterColor: '#00aa2a',
        addedGutterColor: '#00ff41',
        removedGutterColor: '#ff3333',
        codeFoldContentColor: '#00cc33',
        diffViewerTitleBackground: '#141a1c',
        diffViewerTitleColor: '#00ff41',
        diffViewerTitleBorderColor: '#00ff41',
      },
    },
    line: {
      padding: '8px 4px',
      fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
      fontSize: '13px',
      lineHeight: '20px',
    },
    gutter: {
      padding: '8px 8px',
      fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
      fontSize: '12px',
      minWidth: '50px',
      textAlign: 'right',
    },
  }

  const addedLineStats = newCode.split('\n').length - oldCode.split('\n').length
  const isAddition = addedLineStats > 0

  return (
    <div className={`diff-viewer terminal-window ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">DIFFERENTIAL ANALYSIS</div>
      </div>

      {/* Diff Stats Bar */}
      <div className="diff-stats-bar">
        <div className="stats-item">
          <span className="text-muted">&gt; MODE:</span>
          <span className="text-primary phosphor-glow">
            {' '}
            {splitView ? 'SPLIT VIEW' : 'UNIFIED'}
          </span>
        </div>
        <div className="stats-item">
          <span className="text-muted">&gt; CHANGES:</span>
          <span className={isAddition ? 'text-success' : 'text-error'}>
            {' '}
            {isAddition ? '+' : ''}
            {addedLineStats} LINES
          </span>
        </div>
        <div className="stats-item">
          <span className="text-muted">&gt; LANG:</span>
          <span className="text-primary"> {language.toUpperCase()}</span>
        </div>
      </div>

      {/* File Labels */}
      <div className="diff-labels">
        <div className="label-item old-label">
          <span className="label-icon">◄</span>
          <span className="label-text">{oldTitle}</span>
        </div>
        {splitView && (
          <div className="label-item new-label">
            <span className="label-text">{newTitle}</span>
            <span className="label-icon">►</span>
          </div>
        )}
      </div>

      {/* Diff Viewer */}
      <div className="diff-container crt-screen">
        <ReactDiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={splitView}
          compareMethod={DiffMethod.WORDS}
          useDarkTheme={true}
          styles={customStyles}
          leftTitle={undefined} // We use custom labels
          rightTitle={undefined}
          showDiffOnly={false}
          hideLineNumbers={false}
        />
      </div>

      {/* Diff Legend */}
      <div className="diff-legend">
        <div className="legend-item">
          <span className="legend-box added"></span>
          <span className="legend-text text-success">ADDED</span>
        </div>
        <div className="legend-item">
          <span className="legend-box removed"></span>
          <span className="legend-text text-error">REMOVED</span>
        </div>
        <div className="legend-item">
          <span className="legend-box modified"></span>
          <span className="legend-text text-warning">MODIFIED</span>
        </div>
      </div>
    </div>
  )
}

// Compact diff summary
export const DiffSummary: React.FC<{
  additions: number
  deletions: number
  modifications: number
  className?: string
}> = ({ additions, deletions, modifications, className = '' }) => {
  const total = additions + deletions + modifications

  return (
    <div className={`diff-summary terminal-window ${className}`}>
      <div className="terminal-content">
        <div className="summary-header phosphor-glow">
          <span>◆</span> CHANGE SUMMARY
        </div>
        <div className="summary-stats mt-md">
          <div className="stat-line">
            <span className="stat-label text-muted">&gt; ADDITIONS:</span>
            <span className="stat-value text-success phosphor-glow">
              +{additions} lines
            </span>
          </div>
          <div className="stat-line">
            <span className="stat-label text-muted">&gt; DELETIONS:</span>
            <span className="stat-value text-error phosphor-glow">
              -{deletions} lines
            </span>
          </div>
          <div className="stat-line">
            <span className="stat-label text-muted">&gt; MODIFICATIONS:</span>
            <span className="stat-value text-warning phosphor-glow">
              ~{modifications} lines
            </span>
          </div>
          <div className="stat-divider mt-sm mb-sm">
            ═══════════════════════════════
          </div>
          <div className="stat-line">
            <span className="stat-label text-muted">&gt; TOTAL:</span>
            <span className="stat-value text-primary phosphor-glow">{total} changes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline diff for small changes
export const InlineDiff: React.FC<{
  oldText: string
  newText: string
  className?: string
}> = ({ oldText, newText, className = '' }) => {
  return (
    <div className={`inline-diff ${className}`}>
      <div className="inline-diff-line removed">
        <span className="diff-marker">-</span>
        <span className="diff-text">{oldText}</span>
      </div>
      <div className="inline-diff-line added">
        <span className="diff-marker">+</span>
        <span className="diff-text">{newText}</span>
      </div>
    </div>
  )
}
