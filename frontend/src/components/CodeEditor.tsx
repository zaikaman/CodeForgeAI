import React, { useRef, useEffect } from 'react'
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import '../styles/theme.css'
import './CodeEditor.css'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string
  showMinimap?: boolean
  className?: string
  title?: string
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  readOnly = false,
  height = '500px',
  showMinimap = true,
  className = '',
  title = 'CODE EDITOR',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Define custom retro terminal theme
    monaco.editor.defineTheme('terminal-green', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '00aa2a', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ff41', fontStyle: 'bold' },
        { token: 'string', foreground: '33ff66' },
        { token: 'number', foreground: '00cc33' },
        { token: 'type', foreground: '00ff41' },
        { token: 'class', foreground: '00ff41', fontStyle: 'bold' },
        { token: 'function', foreground: '33ff66' },
        { token: 'variable', foreground: '00cc33' },
        { token: 'constant', foreground: '00ff41' },
        { token: 'operator', foreground: '00cc33' },
        { token: 'delimiter', foreground: '00aa2a' },
      ],
      colors: {
        'editor.background': '#0a0e0f',
        'editor.foreground': '#00ff41',
        'editor.lineHighlightBackground': '#141a1c',
        'editor.selectionBackground': '#006619',
        'editor.inactiveSelectionBackground': '#00441a',
        'editorCursor.foreground': '#00ff41',
        'editorWhitespace.foreground': '#00441a',
        'editorIndentGuide.background': '#00441a',
        'editorIndentGuide.activeBackground': '#006619',
        'editorLineNumber.foreground': '#00aa2a',
        'editorLineNumber.activeForeground': '#00ff41',
        'editorBracketMatch.background': '#006619',
        'editorBracketMatch.border': '#00ff41',
        'scrollbarSlider.background': '#00aa2a80',
        'scrollbarSlider.hoverBackground': '#00cc3380',
        'scrollbarSlider.activeBackground': '#00ff4180',
      },
    })

    monaco.editor.setTheme('terminal-green')

    // Add custom font settings
    editor.updateOptions({
      fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.5,
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value)
    }
  }

  return (
    <div className={`code-editor terminal-window ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">{title}</div>
      </div>

      {/* Editor Status Bar */}
      <div className="editor-status-bar">
        <div className="status-item">
          <span className="text-muted">&gt; LANG:</span>
          <span className="text-primary phosphor-glow"> {language.toUpperCase()}</span>
        </div>
        <div className="status-item">
          <span className="text-muted">&gt; MODE:</span>
          <span className={readOnly ? 'text-warning' : 'text-success'}>
            {' '}
            {readOnly ? '[READ-ONLY]' : '[EDIT]'}
          </span>
        </div>
        <div className="status-item">
          <span className="text-muted">&gt; LINES:</span>
          <span className="text-primary"> {value.split('\n').length}</span>
        </div>
        <div className="status-item">
          <span className="text-muted">&gt; CHARS:</span>
          <span className="text-primary"> {value.length}</span>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="editor-container crt-screen">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: {
              enabled: showMinimap,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            cursorBlinking: 'solid',
            cursorStyle: 'block',
            renderWhitespace: 'selection',
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="editor-footer">
        <div className="footer-text text-muted">
          <span className="phosphor-glow">◆</span> CODEFORGE EDITOR v1.0.0
          <span className="separator">|</span>
          {readOnly ? 'VIEW MODE' : 'READY'}
        </div>
      </div>
    </div>
  )
}

// Compact version for previews
export const CodePreview: React.FC<{
  code: string
  language?: string
  maxLines?: number
  className?: string
}> = ({ code, language = 'typescript', maxLines = 10, className = '' }) => {
  const lines = code.split('\n').slice(0, maxLines)
  const truncated = code.split('\n').length > maxLines

  return (
    <div className={`code-preview terminal-window ${className}`}>
      <div className="terminal-header">
        <div className="terminal-title">
          CODE PREVIEW [{language.toUpperCase()}]
        </div>
      </div>
      <div className="preview-content">
        <pre className="preview-code phosphor-glow">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="preview-line">
                <span className="line-number">{String(idx + 1).padStart(3, ' ')}</span>
                <span className="line-content">{line || ' '}</span>
              </div>
            ))}
            {truncated && (
              <div className="preview-line text-muted">
                <span className="line-number">...</span>
                <span className="line-content">
                  [{code.split('\n').length - maxLines} more lines]
                </span>
              </div>
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}
