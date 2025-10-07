import React, { useState } from 'react'
import { GenerationForm, GenerationOptions } from '../components/GenerationForm'
import { CodeEditor } from '../components/CodeEditor'
import { AgentChat } from '../components/AgentChat'
import { SystemStatus } from '../components/StatusIndicator'
import { useGeneration } from '../hooks/useGeneration'
import { useWebSocket } from '../hooks/useWebSocket'
import '../styles/theme.css'
import './GeneratePage.css'

export const GeneratePage: React.FC = () => {
  const [generatedCode, setGeneratedCode] = useState('')
  const { isGenerating, agentMessages, currentGeneration, generate } = useGeneration()
  const { isConnected } = useWebSocket()

  const handleGenerate = async (options: GenerationOptions) => {
    try {
      await generate({
        prompt: options.prompt,
        projectContext: options.projectContext,
        includeTests: options.includeTests,
        includeDocumentation: options.includeDocumentation,
        targetLanguage: options.targetLanguage,
        complexity: options.complexity,
        agents: options.agents,
      })

      // Update generated code when complete
      if (currentGeneration?.response?.code) {
        setGeneratedCode(currentGeneration.response.code)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  return (
    <div className="generate-page crt-screen">
      {/* Page Header */}
      <div className="page-header terminal-window">
        <div className="terminal-header">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
          <div className="terminal-title">CODE GENERATION INTERFACE</div>
        </div>
        <div className="terminal-content">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title phosphor-glow">
                ◆ CODE GENERATION TERMINAL
              </h1>
              <p className="page-description">
                &gt; Deploy multi-agent AI system to generate production-ready code
              </p>
            </div>
            <SystemStatus
              agentStatus={isGenerating ? 'PROCESSING' : 'STANDBY'}
              connectionStatus={isConnected ? 'online' : 'offline'}
              queueSize={0}
              className="header-status"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="generate-grid">
        {/* Left Panel - Generation Form */}
        <div className="generate-panel form-panel">
          <GenerationForm
            onSubmit={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Center Panel - Code Editor */}
        <div className="generate-panel editor-panel">
          <CodeEditor
            value={generatedCode || currentGeneration?.response?.code || '// Generated code will appear here...\n// Waiting for generation request...'}
            onChange={setGeneratedCode}
            language={currentGeneration?.request?.targetLanguage || 'typescript'}
            readOnly={isGenerating}
            title="GENERATED CODE OUTPUT"
          />

          {/* Code Metadata */}
          {currentGeneration?.response && (
            <div className="code-metadata terminal-window mt-md">
              <div className="terminal-content">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="text-muted">&gt; CONFIDENCE:</span>
                    <span className="text-success phosphor-glow">
                      {' '}{(currentGeneration.response.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="text-muted">&gt; SYNTAX:</span>
                    <span className={currentGeneration.response.validation.syntaxValid ? 'text-success' : 'text-error'}>
                      {' '}{currentGeneration.response.validation.syntaxValid ? '[VALID]' : '[INVALID]'}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="text-muted">&gt; LANGUAGE:</span>
                    <span className="text-primary">
                      {' '}{currentGeneration.response.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="text-muted">&gt; LINES:</span>
                    <span className="text-primary">
                      {' '}{generatedCode.split('\n').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Agent Chat */}
        <div className="generate-panel chat-panel">
          <AgentChat
            messages={agentMessages}
            isStreaming={isGenerating}
            agentStatus={isGenerating ? 'PROCESSING' : 'STANDBY'}
          />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions terminal-window">
        <div className="terminal-content">
          <div className="actions-grid">
            <button
              className="btn btn-primary"
              disabled={!generatedCode || isGenerating}
              onClick={() => {
                navigator.clipboard.writeText(generatedCode)
              }}
            >
              ► COPY CODE
            </button>
            <button
              className="btn"
              disabled={!generatedCode || isGenerating}
              onClick={() => {
                const blob = new Blob([generatedCode], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `generated-code.${currentGeneration?.request?.targetLanguage || 'txt'}`
                a.click()
              }}
            >
              DOWNLOAD
            </button>
            <button
              className="btn"
              disabled={isGenerating}
              onClick={() => {
                setGeneratedCode('')
              }}
            >
              CLEAR
            </button>
            <button
              className="btn btn-danger"
              disabled={!isGenerating}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
