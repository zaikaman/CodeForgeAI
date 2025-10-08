import React, { useState } from 'react'
import { StatusIndicator } from './StatusIndicator'
import '../styles/theme.css'
import './GenerationForm.css'

export interface GenerationOptions {
  prompt: string
  projectContext?: string
  includeTests: boolean
  includeDocumentation: boolean
  targetLanguage: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: string[]
}

interface GenerationFormProps {
  onSubmit: (options: GenerationOptions) => void
  isGenerating?: boolean
  className?: string
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onSubmit,
  isGenerating = false,
  className = '',
}) => {
  const [prompt, setPrompt] = useState('')
  const [projectContext, setProjectContext] = useState('')
  const [includeTests, setIncludeTests] = useState(true)
  const [includeDocumentation, setIncludeDocumentation] = useState(true)
  const [targetLanguage, setTargetLanguage] = useState('typescript')
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex'>('moderate')
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['CodeGenerator', 'TestCrafter'])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const availableAgents = [
    { id: 'CodeGenerator', name: 'CODE GENERATOR', icon: '▣' },
    { id: 'TestCrafter', name: 'TEST CRAFTER', icon: '◎' },
    { id: 'DocWeaver', name: 'DOC WEAVER', icon: '◐' },
    { id: 'RefactorGuru', name: 'REFACTOR GURU', icon: '▼' },
    { id: 'SecuritySentinel', name: 'SECURITY SENTINEL', icon: '◈' },
    { id: 'PerformanceProfiler', name: 'PERFORMANCE PROFILER', icon: '◉' },
  ]

  const languages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      prompt,
      projectContext,
      includeTests,
      includeDocumentation,
      targetLanguage,
      complexity,
      agents: selectedAgents,
    })
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    )
  }

  return (
    <div className={`generation-form terminal-window ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">CODE GENERATION PROTOCOL</div>
      </div>

      <div className="terminal-content">
        <form onSubmit={handleSubmit} className="form-container">
          {/* Prompt Input */}
          <div className="form-section">
            <label className="form-label phosphor-glow">&gt; GENERATION PROMPT (REQUIRED):</label>
            <div className="input-wrapper">
              <span className="input-prefix">&gt;&gt;</span>
              <textarea
                className="input terminal-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your code generation request..."
                required
                disabled={isGenerating}
                rows={4}
              />
            </div>
            <div className="form-hint text-muted mt-sm">
              Describe what code you want to generate in natural language
            </div>
          </div>

          {/* Project Context */}
          <div className="form-section mt-lg">
            <label className="form-label phosphor-glow">&gt; PROJECT CONTEXT (OPTIONAL):</label>
            <div className="input-wrapper">
              <span className="input-prefix">&gt;&gt;</span>
              <textarea
                className="input terminal-textarea"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                placeholder="Provide additional project context..."
                disabled={isGenerating}
                rows={3}
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="form-section mt-lg">
            <button type="button" className="btn-toggle-advanced" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? '▼ HIDE ADVANCED OPTIONS' : '► SHOW ADVANCED OPTIONS'}
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-options">
              {/* Language Selection */}
              <div className="form-section mt-lg">
                <label className="form-label phosphor-glow">&gt; TARGET LANGUAGE:</label>
                <div className="language-grid">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={`language-btn ${targetLanguage === lang ? 'active' : ''}`}
                      onClick={() => setTargetLanguage(lang)}
                      disabled={isGenerating}
                    >
                      <span className="lang-icon">◆</span>
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity Selection */}
              <div className="form-section mt-lg">
                <label className="form-label phosphor-glow">&gt; COMPLEXITY LEVEL:</label>
                <div className="complexity-selector">
                  {(['simple', 'moderate', 'complex'] as const).map((level) => (
                    <label key={level} className="complexity-option">
                      <input
                        type="radio"
                        name="complexity"
                        value={level}
                        checked={complexity === level}
                        onChange={() => setComplexity(level)}
                        disabled={isGenerating}
                      />
                      <span className="complexity-label">
                        <span className="complexity-icon">
                          {level === 'simple' ? '▲' : level === 'moderate' ? '▣' : '◆'}
                        </span>
                        {level.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="form-section mt-lg">
                <label className="form-label phosphor-glow">&gt; GENERATION OPTIONS:</label>
                <div className="options-grid">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={includeTests}
                      onChange={(e) => setIncludeTests(e.target.checked)}
                      disabled={isGenerating}
                    />
                    <span className="checkbox-label">
                      <span className="checkbox-icon">◎</span>
                      INCLUDE TESTS
                    </span>
                  </label>
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={includeDocumentation}
                      onChange={(e) => setIncludeDocumentation(e.target.checked)}
                      disabled={isGenerating}
                    />
                    <span className="checkbox-label">
                      <span className="checkbox-icon">◐</span>
                      INCLUDE DOCUMENTATION
                    </span>
                  </label>
                </div>
              </div>

              {/* Agent Selection */}
              <div className="form-section mt-lg">
                <label className="form-label phosphor-glow">&gt; SELECT AGENTS:</label>
                <div className="agents-grid">
                  {availableAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      className={`agent-btn ${selectedAgents.includes(agent.id) ? 'active' : ''}`}
                      onClick={() => toggleAgent(agent.id)}
                      disabled={isGenerating}
                    >
                      <span className="agent-icon">{agent.icon}</span>
                      <span className="agent-name">{agent.name}</span>
                    </button>
                  ))}
                </div>
                <div className="form-hint text-muted mt-sm">
                  Selected: {selectedAgents.length} agent(s)
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions mt-xl">
            <button type="submit" className="btn btn-primary full-width" disabled={isGenerating || !prompt}>
              {isGenerating ? (
                <>
                  <StatusIndicator status="loading" size="small" showIcon={false} />
                  GENERATING CODE...
                </>
              ) : (
                '► INITIATE CODE GENERATION'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
