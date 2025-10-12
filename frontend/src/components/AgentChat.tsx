import React, { useEffect, useRef, useState } from 'react'
import { StatusIndicator } from './StatusIndicator'
import '../styles/theme.css'
import './AgentChat.css'

export interface AgentMessage {
  id: string
  agent: string
  role: 'system' | 'agent' | 'user' | 'thought'
  content: string
  timestamp: Date
  toolCalls?: string[]
  imageUrls?: string[]
}

interface AgentChatProps {
  messages: AgentMessage[]
  isStreaming?: boolean
  agentStatus?: string
  className?: string
}

export const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  isStreaming = false,
  agentStatus = 'IDLE',
  className = '',
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Log messages received
  useEffect(() => {
    console.log(`[AgentChat] Received ${messages.length} messages`);
  }, [messages.length]);

  // Filter out invalid messages (no content, invalid timestamp, etc)
  const validMessages = React.useMemo(() => {
    const filtered = messages.filter(msg => {
      // Must have content
      if (!msg.content || msg.content.trim() === '') {
        console.warn('[AgentChat] Filtering out message with no content:', msg.id);
        return false;
      }
      
      // Check timestamp validity - be more lenient
      try {
        const dateObj = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
        if (isNaN(dateObj.getTime())) {
          console.warn('[AgentChat] Filtering out message with invalid timestamp:', msg.id, msg.timestamp);
          return false;
        }
      } catch (error) {
        console.warn('[AgentChat] Error checking timestamp for message:', msg.id, error);
        return false;
      }
      
      return true;
    });
    
    console.log(`[AgentChat] Filtered messages: ${messages.length} → ${filtered.length}`);
    return filtered;
  }, [messages]);

  useEffect(() => {
    if (autoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [validMessages, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const getAgentIcon = (agent: string) => {
    const icons: Record<string, string> = {
      'LeadEngineer': '◆',
      'SpecInterpreter': '◇',
      'CodeGenerator': '▣',
      'BugHunter': '▲',
      'RefactorGuru': '▼',
      'SecuritySentinel': '◈',
      'PerformanceProfiler': '◉',
      'TestCrafter': '◎',
      'DocWeaver': '◐',
    }
    return icons[agent] || '●'
  }

  const getMessageColor = (role: string) => {
    switch (role) {
      case 'system':
        return 'text-warning'
      case 'agent':
        return 'text-primary'
      case 'user':
        return 'text-success'
      case 'thought':
        return 'text-muted'
      default:
        return 'text-primary'
    }
  }

  const formatTimestamp = (date: Date | string | number) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '--:--:--';
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={`agent-chat terminal-window ${className}`}>
      {/* Chat Header */}
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">
          AGENT COMMUNICATION CHANNEL
        </div>
      </div>

      {/* Agent Status Bar */}
      <div className="chat-status-bar">
        <StatusIndicator
          status={isStreaming ? 'loading' : 'success'}
          message={agentStatus}
          size="small"
        />
        <div className="status-indicator-line">
          ═══════════════════════════════════════
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages" onScroll={handleScroll}>
        {validMessages.length === 0 ? (
          <div className="chat-empty">
            <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      AWAITING AGENT RESPONSE      ║
    ║                                   ║
    ║   ►  System initialized           ║
    ║   ►  Agents ready                 ║
    ║   ►  Listening for commands...    ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
            </pre>
          </div>
        ) : (
          validMessages.map((message, index) => (
            <div
              key={message.id}
              className={`chat-message ${message.role} ${getMessageColor(message.role)}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Message Header */}
              <div className="message-header">
                <span className="message-icon phosphor-glow">
                  {getAgentIcon(message.agent)}
                </span>
                <span className="message-agent phosphor-glow">
                  [{message.agent.toUpperCase()}]
                </span>
                <span className="message-role">
                  {message.role === 'thought' ? '(THINKING)' : ''}
                </span>
                <span className="message-timestamp text-muted">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              <div className="message-content">
                <span className="message-prefix">&gt;&gt;</span>
                <span className="message-text">
                  {message.content}
                  {message.role === 'thought' && (
                    <span className="typing-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  )}
                </span>
              </div>

              {/* Message Images */}
              {message.imageUrls && message.imageUrls.length > 0 && (
                <div className="message-images">
                  {message.imageUrls.map((url, idx) => (
                    <div key={idx} className="message-image-wrapper">
                      <img src={url} alt={`Attachment ${idx + 1}`} className="message-image" />
                    </div>
                  ))}
                </div>
              )}

              {/* Tool Calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="message-tools">
                  <div className="tools-label text-muted">
                    &gt; TOOLS EXECUTED:
                  </div>
                  {message.toolCalls.map((tool, idx) => (
                    <div key={idx} className="tool-call">
                      <span className="tool-icon">⚙</span>
                      <span className="tool-name">{tool}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="chat-streaming">
            <span className="streaming-icon phosphor-glow">◉</span>
            <span className="streaming-text">AGENT PROCESSING</span>
            <span className="streaming-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Footer */}
      <div className="chat-footer">
        <div className="footer-stats">
          <span className="text-muted">MESSAGES: {validMessages.length}</span>
          <span className="text-muted">STATUS: {isStreaming ? 'ACTIVE' : 'STANDBY'}</span>
          <span className="text-muted">
            SCROLL: {autoScroll ? 'AUTO' : 'MANUAL'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Compact version for sidebars
export const AgentChatCompact: React.FC<{
  latestMessage?: AgentMessage
  messageCount: number
  isActive: boolean
}> = ({ latestMessage, messageCount, isActive }) => {
  return (
    <div className="agent-chat-compact terminal-window">
      <div className="terminal-content">
        <div className="compact-header">
          <span className="text-primary phosphor-glow">◆ AGENT CHANNEL</span>
          <span className="badge badge-success">{messageCount}</span>
        </div>

        {latestMessage && (
          <div className="compact-message mt-sm">
            <div className="text-muted">
              [{latestMessage.agent}] {formatTimestamp(latestMessage.timestamp)}
            </div>
            <div className="text-primary">
              &gt; {latestMessage.content.substring(0, 50)}
              {latestMessage.content.length > 50 ? '...' : ''}
            </div>
          </div>
        )}

        {isActive && (
          <div className="compact-status mt-sm">
            <StatusIndicator status="loading" message="PROCESSING" size="small" />
          </div>
        )}
      </div>
    </div>
  )
}

function formatTimestamp(timestamp: Date | string | number): string {
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '--:--:--';
  }
  
  return dateObj.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
