import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MatrixBackground } from '../components/MatrixBackground'
import { TypingEffect } from '../components/TypingEffect'
import '../styles/theme.css'
import './HomePage.css'

export const HomePage: React.FC = () => {
  const [bootComplete, setBootComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setBootComplete(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (!bootComplete) {
    return (
      <div className="home-page crt-screen auth-page full-height flex items-center justify-center">
        <div className="boot-sequence">
          <pre className="boot-ascii phosphor-glow auth-page">
{`╔══════════════════════════════════════╗
║   CODEFORGE AI SYSTEM LOADING...    ║
╚══════════════════════════════════════╝`}
          </pre>
          <div className="boot-progress mt-lg">
            <div className="boot-bar"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page crt-screen auth-page">
      <MatrixBackground />
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="ascii-title phosphor-glow auth-page">
            <pre>
{`
   ██████╗ ██████╗ ██████╗ ███████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ██║     ██║   ██║██║  ██║█████╗  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██║     ██║   ██║██║  ██║██╔══╝  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ╚██████╗╚██████╔╝██████╔╝███████╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝

             ███╗   ███╗██╗   ██╗██╗  ████████╗██╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗
             ████╗ ████║██║   ██║██║  ╚══██╔══╝██║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
             ██╔████╔██║██║   ██║██║     ██║   ██║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
             ██║╚██╔╝██║██║   ██║██║     ██║   ██║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
             ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ██║     ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
             ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
`}
            </pre>
          </div>

          <div className="hero-content">
            <TypingEffect
              text="NEXT-GENERATION AI DEVELOPMENT ECOSYSTEM"
              speed={80}
              className="hero-title phosphor-glow auth-page"
            />
            <p className="hero-subtitle">
              &gt; Multi-channel AI platform with intelligent agents, GitHub integration, and voice commands
            </p>
            <p className="hero-description">
              CodeForge AI provides a complete AI-powered development experience with specialized agents,
              GitHub MCP integration, Telegram bot, voice commands, background job processing, and real-time
              code generation - all working together seamlessly.
            </p>

            <div className="hero-actions mt-xl">
              <Link to="/terminal" className="btn btn-primary btn-large">
                ► LAUNCH TERMINAL
              </Link>
              <Link to="/login" className="btn btn-large">
                ACCESS PLATFORM
              </Link>
            </div>

            <div className="hero-stats mt-xl">
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">10+</div>
                <div className="stat-label">SPECIALIZED AGENTS</div>
              </div>
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">4</div>
                <div className="stat-label">ACCESS CHANNELS</div>
              </div>
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">GITHUB</div>
                <div className="stat-label">MCP INTEGRATION</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Channels Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title phosphor-glow auth-page">
            ╔══════════════════════════════════════╗
            <br />
            ║       MULTI-CHANNEL ACCESS          ║
            <br />
            ╚══════════════════════════════════════╝
          </h2>
          <p className="section-subtitle">
            Access CodeForge AI through your preferred interface - Web, Terminal, Telegram, or Voice
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🖥️</div>
            <h3 className="feature-title">WEB TERMINAL</h3>
            <p className="feature-description">
              Full-featured web interface with real-time code generation, live preview, file
              management, and multi-agent orchestration. Perfect for complex projects.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">REAL-TIME</span>
              <span className="badge badge-success">LIVE PREVIEW</span>
              <span className="badge badge-success">FILE MANAGER</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">💬</div>
            <h3 className="feature-title">TELEGRAM BOT</h3>
            <p className="feature-description">
              Code on the go with our Telegram bot. Send requests, receive code, create GitHub PRs,
              and manage background jobs - all from your phone.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">@CodeForgeAI_Bot</span>
              <span className="badge badge-success">MOBILE</span>
              <span className="badge badge-success">ASYNC JOBS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🎤</div>
            <h3 className="feature-title">VOICE COMMANDS</h3>
            <p className="feature-description">
              Talk to CodeForge AI using VAPI voice integration. Create background jobs with voice
              commands and receive updates via notifications.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">VAPI</span>
              <span className="badge badge-success">HANDS-FREE</span>
              <span className="badge badge-success">NATURAL LANGUAGE</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🔄</div>
            <h3 className="feature-title">BACKGROUND JOBS</h3>
            <p className="feature-description">
              Long-running tasks process in the background with real-time progress tracking. Perfect
              for complex code generation and GitHub operations.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">ASYNC</span>
              <span className="badge badge-success">NOTIFICATIONS</span>
              <span className="badge badge-success">STATUS TRACKING</span>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Integration Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title phosphor-glow auth-page">
            ╔══════════════════════════════════════╗
            <br />
            ║      GITHUB MCP INTEGRATION         ║
            <br />
            ╚══════════════════════════════════════╝
          </h2>
          <p className="section-subtitle">
            Native GitHub integration powered by Model Context Protocol (MCP)
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🔱</div>
            <h3 className="feature-title">REPOSITORY OPERATIONS</h3>
            <p className="feature-description">
              Create, fork, and manage repositories. Search code, list repos, get repository
              information, and perform all GitHub operations directly from chat.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">CREATE REPOS</span>
              <span className="badge badge-success">FORK</span>
              <span className="badge badge-success">SEARCH</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🔀</div>
            <h3 className="feature-title">PULL REQUESTS & ISSUES</h3>
            <p className="feature-description">
              Create PRs with generated code, open issues, comment on discussions. Full GitHub
              collaboration workflow from natural language requests.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">AUTO PR</span>
              <span className="badge badge-success">ISSUES</span>
              <span className="badge badge-success">COMMENTS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">📂</div>
            <h3 className="feature-title">FILE MANAGEMENT</h3>
            <p className="feature-description">
              Fetch files from repos, update content, create branches, and push changes. Seamlessly
              work with your GitHub codebase.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">READ FILES</span>
              <span className="badge badge-success">UPDATE</span>
              <span className="badge badge-success">BRANCHES</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🤖</div>
            <h3 className="feature-title">BOT-POWERED</h3>
            <p className="feature-description">
              Works without personal tokens! Our bot performs operations on public repos. Optional
              token support for private repos and direct pushes.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">NO TOKEN NEEDED</span>
              <span className="badge badge-success">PUBLIC REPOS</span>
              <span className="badge badge-success">SECURE</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title phosphor-glow auth-page">
            ╔══════════════════════════════════════╗
            <br />
            ║      SPECIALIZED AI AGENTS          ║
            <br />
            ╚══════════════════════════════════════╝
          </h2>
          <p className="section-subtitle">
            Intelligent routing to expert agents for every development task
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🎯</div>
            <h3 className="feature-title">CHAT AGENT</h3>
            <p className="feature-description">
              Smart routing hub that analyzes requests and delegates to specialized agents. Handles
              conversations and coordinates multi-agent workflows.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">ROUTING</span>
              <span className="badge badge-success">ORCHESTRATION</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">⚡</div>
            <h3 className="feature-title">SIMPLE CODER</h3>
            <p className="feature-description">
              Generates static HTML/CSS/JavaScript websites. Perfect for landing pages, calculators,
              forms, and simple interactive applications.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">HTML</span>
              <span className="badge badge-success">CSS</span>
              <span className="badge badge-success">VANILLA JS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🚀</div>
            <h3 className="feature-title">COMPLEX CODER</h3>
            <p className="feature-description">
              Full-stack development with frameworks. React, TypeScript, Next.js, Vue, Node.js, and
              more. Production-ready code with best practices.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">REACT</span>
              <span className="badge badge-success">TYPESCRIPT</span>
              <span className="badge badge-success">FRAMEWORKS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🔧</div>
            <h3 className="feature-title">CODE MODIFICATION</h3>
            <p className="feature-description">
              Fixes bugs, adds features, refactors code, and resolves errors in existing projects.
              Understands context and maintains code quality.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">BUG FIXES</span>
              <span className="badge badge-success">FEATURES</span>
              <span className="badge badge-success">REFACTOR</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🐛</div>
            <h3 className="feature-title">BUG HUNTER</h3>
            <p className="feature-description">
              Deep code analysis to find hidden bugs, logic errors, edge cases, and potential
              runtime issues before they reach production.
            </p>
            <div className="feature-tags">
              <span className="badge badge-error">DETECTION</span>
              <span className="badge badge-warning">ANALYSIS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🔒</div>
            <h3 className="feature-title">SECURITY SENTINEL</h3>
            <p className="feature-description">
              Security vulnerability scanning. Detects injection attacks, XSS, CSRF, insecure
              dependencies, and security anti-patterns.
            </p>
            <div className="feature-tags">
              <span className="badge badge-error">CRITICAL</span>
              <span className="badge badge-warning">VULNERABILITIES</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">⚡</div>
            <h3 className="feature-title">PERFORMANCE PROFILER</h3>
            <p className="feature-description">
              Analyzes code complexity, identifies bottlenecks, and suggests optimizations. Improves
              time complexity and resource usage.
            </p>
            <div className="feature-tags">
              <span className="badge badge-warning">O(n²) → O(n)</span>
              <span className="badge badge-success">OPTIMIZED</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🧪</div>
            <h3 className="feature-title">TEST CRAFTER</h3>
            <p className="feature-description">
              Generates comprehensive test suites. Unit tests, integration tests, edge cases, and
              test fixtures for all major frameworks.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">JEST</span>
              <span className="badge badge-success">PYTEST</span>
              <span className="badge badge-success">VITEST</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">📚</div>
            <h3 className="feature-title">DOC WEAVER</h3>
            <p className="feature-description">
              Creates comprehensive documentation. TSDoc, JSDoc, READMEs, API docs, and inline
              comments that explain complex logic clearly.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">TSDOC</span>
              <span className="badge badge-success">MARKDOWN</span>
              <span className="badge badge-success">API DOCS</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">🐙</div>
            <h3 className="feature-title">GITHUB AGENT</h3>
            <p className="feature-description">
              Specialized agent for GitHub operations. Creates PRs, manages repos, handles issues,
              fetches code, and coordinates GitHub workflows.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">MCP POWERED</span>
              <span className="badge badge-success">FULL GITHUB API</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-terminal terminal-window">
          <div className="terminal-header">
            <div className="terminal-button close"></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
            <div className="terminal-title">SYSTEM READY</div>
          </div>
          <div className="terminal-content">
            <pre className="cta-ascii phosphor-glow auth-page">
{`   ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║        ►  PLATFORM STATUS: FULLY OPERATIONAL      ║
    ║        ►  AI AGENTS: 10+ SPECIALISTS ACTIVE       ║
    ║        ►  GITHUB MCP: CONNECTED                   ║
    ║        ►  TELEGRAM BOT: @CodeForgeAI_Bot          ║
    ║        ►  VOICE COMMANDS: ENABLED                 ║
    ║        ►  BACKGROUND JOBS: PROCESSING             ║
    ║        ►  SECURITY LEVEL: MAXIMUM                 ║
    ║                                                   ║
    ║              READY FOR DEPLOYMENT                 ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝`}
            </pre>
            <div className="cta-content">
              <h3 className="cta-title phosphor-glow auth-page">ACTIVATE YOUR AI DEVELOPMENT ECOSYSTEM</h3>
              <p className="cta-text">
                Join developers using the most advanced AI-powered development platform. Multiple
                access channels, intelligent agents, and GitHub integration - all in one system.
              </p>
              <div className="cta-features">
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> Web Terminal Interface
                </div>
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> Telegram Bot Access
                </div>
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> Voice Command Integration
                </div>
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> GitHub MCP Integration
                </div>
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> Background Job Processing
                </div>
                <div className="cta-feature">
                  <span className="phosphor-glow auth-page">✓</span> 10+ Specialized AI Agents
                </div>
              </div>
              <Link to="/signup" className="btn btn-primary btn-large mt-md">
                ► ACTIVATE NOW
              </Link>
              <p className="text-muted mt-sm" style={{ fontSize: '0.9rem' }}>
                No credit card required • Free tier available • Full access to all channels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-text text-muted">
            CODEFORGE AI © 2025 | NEXT-GENERATION AI DEVELOPMENT ECOSYSTEM
          </div>
          <div className="footer-links">
            <a href="/docs" className="footer-link">DOCUMENTATION</a>
            <span className="footer-separator">|</span>
            <a href="/api" className="footer-link">API</a>
            <span className="footer-separator">|</span>
            <a href="https://t.me/CodeForgeAI_Bot" className="footer-link" target="_blank" rel="noopener noreferrer">TELEGRAM BOT</a>
            <span className="footer-separator">|</span>
            <a href="/github" className="footer-link">GITHUB</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
