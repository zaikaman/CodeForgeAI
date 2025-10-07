import React, { useState } from 'react'
import { CodeEditor } from '../components/CodeEditor'
import { ReviewPanel } from '../components/ReviewPanel'
import { useReview } from '../hooks/useReview'
import '../styles/theme.css'
import './ReviewPage.css'

export const ReviewPage: React.FC = () => {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('typescript')
  const { isReviewing, findings, review } = useReview()

  const handleReview = async () => {
    if (!code.trim()) return

    await review({
      code,
      language,
      options: {
        checkSecurity: true,
        checkPerformance: true,
        checkStyle: true,
      },
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)

      // Detect language from file extension
      const ext = file.name.split('.').pop()?.toLowerCase()
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        java: 'java',
        go: 'go',
        rs: 'rust',
      }
      if (ext && langMap[ext]) {
        setLanguage(langMap[ext])
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="review-page crt-screen">
      {/* Header */}
      <div className="page-header terminal-window">
        <div className="terminal-header">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
          <div className="terminal-title">CODE REVIEW ANALYSIS</div>
        </div>
        <div className="terminal-content">
          <h1 className="page-title phosphor-glow">◈ MULTI-AGENT CODE REVIEW</h1>
          <p className="page-description">
            &gt; Security, performance, and quality analysis by specialized agents
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="review-controls terminal-window">
        <div className="terminal-content">
          <div className="controls-grid">
            <div className="control-group">
              <label className="control-label text-muted">&gt; LANGUAGE:</label>
              <select
                className="input control-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="typescript">TYPESCRIPT</option>
                <option value="javascript">JAVASCRIPT</option>
                <option value="python">PYTHON</option>
                <option value="java">JAVA</option>
                <option value="go">GO</option>
                <option value="rust">RUST</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label text-muted">&gt; UPLOAD FILE:</label>
              <input
                type="file"
                className="input control-file"
                onChange={handleFileUpload}
                accept=".ts,.tsx,.js,.jsx,.py,.java,.go,.rs"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleReview}
              disabled={isReviewing || !code.trim()}
            >
              {isReviewing ? '◉ ANALYZING...' : '► START REVIEW'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="review-grid">
        {/* Code Editor */}
        <div className="review-panel editor-panel">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            title="CODE INPUT"
          />
        </div>

        {/* Review Results */}
        <div className="review-panel results-panel">
          <ReviewPanel
            findings={findings}
            isAnalyzing={isReviewing}
          />
        </div>
      </div>
    </div>
  )
}
