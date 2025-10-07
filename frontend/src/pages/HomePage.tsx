import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
            <h1 className="hero-title phosphor-glow auth-page typing-effect">
              AUTONOMOUS CODE GENERATION SYSTEM
            </h1>
            <p className="hero-subtitle">
              &gt; Multi-agent AI architecture powered by collaborative intelligence
            </p>
            <p className="hero-description">
              CodeForge AI deploys specialized AI agents to analyze, generate, review, and enhance
              your code with unprecedented accuracy and context awareness.
            </p>

            <div className="hero-actions mt-xl">
              <Link to="/signup" className="btn btn-primary btn-large">
                ► INITIALIZE SYSTEM
              </Link>
              <Link to="/login" className="btn btn-large">
                ACCESS TERMINAL
              </Link>
            </div>

            <div className="hero-stats mt-xl">
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">9</div>
                <div className="stat-label">SPECIALIZED AGENTS</div>
              </div>
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">100%</div>
                <div className="stat-label">CODE COVERAGE</div>
              </div>
              <div className="stat-box">
                <div className="stat-value phosphor-glow auth-page">&lt;30s</div>
                <div className="stat-label">AVG GENERATION TIME</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title phosphor-glow auth-page">
            ╔══════════════════════════════════════╗
            <br />
            ║        SYSTEM CAPABILITIES          ║
            <br />
            ╚══════════════════════════════════════╝
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">▣</div>
            <h3 className="feature-title">CODE GENERATION</h3>
            <p className="feature-description">
              Natural language to production-ready code. Our agents understand context, follow best
              practices, and generate idiomatic code in your target language.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">TypeScript</span>
              <span className="badge badge-success">Python</span>
              <span className="badge badge-success">Go</span>
              <span className="badge badge-success">Rust</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">◈</div>
            <h3 className="feature-title">SECURITY ANALYSIS</h3>
            <p className="feature-description">
              Real-time security scanning with our SecuritySentinel agent. Detect vulnerabilities,
              injection attacks, and security anti-patterns before deployment.
            </p>
            <div className="feature-tags">
              <span className="badge badge-error">CRITICAL</span>
              <span className="badge badge-warning">HIGH</span>
              <span className="badge badge-success">MEDIUM</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">◎</div>
            <h3 className="feature-title">TEST GENERATION</h3>
            <p className="feature-description">
              Comprehensive test suites generated automatically. Unit tests, integration tests, and
              edge cases covered by our TestCrafter agent.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">JEST</span>
              <span className="badge badge-success">PYTEST</span>
              <span className="badge badge-success">VITEST</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">◉</div>
            <h3 className="feature-title">PERFORMANCE OPTIMIZATION</h3>
            <p className="feature-description">
              Identify bottlenecks and optimization opportunities. Our PerformanceProfiler agent
              analyzes complexity and suggests improvements.
            </p>
            <div className="feature-tags">
              <span className="badge badge-warning">O(n²) → O(n)</span>
              <span className="badge badge-success">OPTIMIZED</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">▼</div>
            <h3 className="feature-title">CODE REFACTORING</h3>
            <p className="feature-description">
              Modernize legacy code with intelligent refactoring. The RefactorGuru agent applies
              design patterns and best practices automatically.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">CLEAN CODE</span>
              <span className="badge badge-success">DRY</span>
            </div>
          </div>

          <div className="feature-card terminal-window">
            <div className="feature-icon phosphor-glow auth-page">◐</div>
            <h3 className="feature-title">DOCUMENTATION</h3>
            <p className="feature-description">
              Comprehensive documentation generated from code. TSDoc, JSDoc, and inline comments
              created by our DocWeaver agent.
            </p>
            <div className="feature-tags">
              <span className="badge badge-success">TSDOC</span>
              <span className="badge badge-success">MARKDOWN</span>
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
{`    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   ►  SYSTEM STATUS: ONLINE                        ║
    ║   ►  AI AGENTS: OPERATIONAL                       ║
    ║   ►  SECURITY LEVEL: MAXIMUM                      ║
    ║   ►  READY FOR DEPLOYMENT                         ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝`}
            </pre>
            <div className="cta-content">
              <h3 className="cta-title phosphor-glow auth-page">BEGIN CODE GENERATION PROTOCOL</h3>
              <p className="cta-text">
                Join developers using AI-powered code generation. No credit card required.
              </p>
              <Link to="/signup" className="btn btn-primary btn-large mt-md">
                ► START NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-text text-muted">
            CODEFORGE AI © 2025 | MULTI-AGENT CODE GENERATION SYSTEM
          </div>
          <div className="footer-links">
            <a href="/docs" className="footer-link">DOCUMENTATION</a>
            <span className="footer-separator">|</span>
            <a href="/api" className="footer-link">API</a>
            <span className="footer-separator">|</span>
            <a href="/github" className="footer-link">GITHUB</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
