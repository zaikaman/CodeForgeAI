import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MatrixBackground } from '../components/MatrixBackground'
import { TypingEffect } from '../components/TypingEffect'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../styles/theme.css'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

export const HomePage: React.FC = () => {
  const [bootComplete, setBootComplete] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const homePageRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const totalSections = 6

  useEffect(() => {
    const timer = setTimeout(() => {
      setBootComplete(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!bootComplete) return

    // Don't use ScrollTrigger animations, they conflict with manual scroll
    // Just set initial state
    const sections = sectionsRef.current.filter((el): el is HTMLDivElement => el !== null)
    sections.forEach((section) => {
      gsap.set(section, { opacity: 1, y: 0 })
    })
  }, [bootComplete])

  useEffect(() => {
    if (!bootComplete || !homePageRef.current || !wrapperRef.current) return

    let touchStartY = 0
    let touchEndY = 0
    const SCROLL_THRESHOLD = 50 // Minimum distance to trigger scroll

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (isScrolling.current) return

      // Use callback to get latest currentSection value
      setCurrentSection((prevSection) => {
        const direction = e.deltaY > 0 ? 1 : -1
        const nextSection = prevSection + direction

        if (nextSection >= 0 && nextSection < totalSections) {
          isScrolling.current = true

          gsap.to(wrapperRef.current, {
            y: -nextSection * window.innerHeight,
            duration: 1.2,
            ease: 'power2.inOut',
            onComplete: () => {
              isScrolling.current = false
            },
          })

          return nextSection
        } else {
          isScrolling.current = false
          return prevSection
        }
      })
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY
      handleSwipe()
    }

    const handleSwipe = () => {
      if (isScrolling.current) return

      const difference = touchStartY - touchEndY
      const isSwipeDown = difference > SCROLL_THRESHOLD
      const isSwipeUp = difference < -SCROLL_THRESHOLD

      if (!isSwipeDown && !isSwipeUp) return

      setCurrentSection((prevSection) => {
        const direction = isSwipeDown ? 1 : -1
        const nextSection = prevSection + direction

        if (nextSection >= 0 && nextSection < totalSections) {
          isScrolling.current = true

          gsap.to(wrapperRef.current, {
            y: -nextSection * window.innerHeight,
            duration: 1.2,
            ease: 'power2.inOut',
            onComplete: () => {
              isScrolling.current = false
            },
          })

          return nextSection
        } else {
          isScrolling.current = false
          return prevSection
        }
      })
    }

    const homePage = homePageRef.current
    homePage.addEventListener('wheel', handleWheel, { passive: false })
    homePage.addEventListener('touchstart', handleTouchStart, { passive: true })
    homePage.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      homePage.removeEventListener('wheel', handleWheel)
      homePage.removeEventListener('touchstart', handleTouchStart)
      homePage.removeEventListener('touchend', handleTouchEnd)
    }
  }, [bootComplete, totalSections])

  const addToRefs = (el: HTMLElement | null, index: number) => {
    if (el && el instanceof HTMLDivElement) {
      sectionsRef.current[index] = el
    }
  }

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
    <div className="home-page crt-screen auth-page" ref={homePageRef}>
      <MatrixBackground />
      <div className="snap-container">
        <div className="snap-wrapper" ref={wrapperRef}>
          {/* Hero Section - Full Screen */}
          <section 
            className="snap-section hero-section"
            ref={(el) => addToRefs(el, 0)}
          >
        <div className="hero-grid">
          <div className="ascii-title phosphor-glow auth-page hero-ascii">
            <pre>
{`
   ██████╗ ██████╗ ██████╗ ███████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ██║     ██║   ██║██║  ██║█████╗  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██║     ██║   ██║██║  ██║██╔══╝  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ╚██████╗╚██████╔╝██████╔╝███████╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`}
            </pre>
          </div>

          <div className="hero-content">
            <TypingEffect
              text="NEXT-GENERATION AI DEVELOPMENT ECOSYSTEM"
              speed={50}
              className="hero-title phosphor-glow auth-page"
            />
            <p className="hero-subtitle">
              &gt; Multi-channel AI platform with intelligent agents, GitHub integration, and voice commands
            </p>

            <div className="hero-actions mt-xl">
              <Link to="/terminal" className="btn btn-primary btn-large glow-button">
                ► LAUNCH TERMINAL
              </Link>
              <Link to="/docs" className="btn btn-large glow-button">
                📚 READ DOCS
              </Link>
              <Link to="/login" className="btn btn-large glow-button">
                ACCESS PLATFORM
              </Link>
            </div>

            <div className="scroll-indicator">
              <div className="scroll-arrow">▼</div>
              <span>SCROLL TO EXPLORE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Full Screen */}
      <section 
        className="snap-section stats-section"
        ref={(el) => addToRefs(el, 1)}
      >
        <div className="stats-grid">
          <div className="stat-card terminal-window">
            <div className="stat-icon phosphor-glow auth-page">10+</div>
            <h3 className="stat-title">SPECIALIZED AGENTS</h3>
            <p className="stat-description">
              From simple to complex code, bug hunting to security, testing to documentation
            </p>
          </div>
          <div className="stat-card terminal-window">
            <div className="stat-icon phosphor-glow auth-page">4</div>
            <h3 className="stat-title">ACCESS CHANNELS</h3>
            <p className="stat-description">
              Web Terminal, Telegram Bot, Voice Commands, Background Jobs
            </p>
          </div>
          <div className="stat-card terminal-window">
            <div className="stat-icon phosphor-glow auth-page">∞</div>
            <h3 className="stat-title">GITHUB INTEGRATION</h3>
            <p className="stat-description">
              Full MCP integration for seamless repository operations
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Channel Access Section - Full Screen */}
      <section 
        className="snap-section channels-section"
        ref={(el) => addToRefs(el, 2)}
      >
        <div className="section-container">
          <h2 className="section-title phosphor-glow auth-page">
            MULTI-CHANNEL ACCESS
          </h2>
          <div className="channels-grid">
            <div className="channel-card terminal-window">
              <div className="channel-icon">🖥️</div>
              <h3>WEB TERMINAL</h3>
              <p>Real-time code generation with live preview and file management</p>
              <div className="channel-badges">
                <span className="badge badge-success">REAL-TIME</span>
                <span className="badge badge-success">LIVE PREVIEW</span>
              </div>
            </div>
            <div className="channel-card terminal-window">
              <div className="channel-icon">💬</div>
              <h3>TELEGRAM BOT</h3>
              <p>Code on the go - @CodeForgeAI_Bot for mobile development</p>
              <div className="channel-badges">
                <span className="badge badge-success">MOBILE</span>
                <span className="badge badge-success">ASYNC</span>
              </div>
            </div>
            <div className="channel-card terminal-window">
              <div className="channel-icon">🎤</div>
              <h3>VOICE COMMANDS</h3>
              <p>VAPI integration for hands-free coding experience</p>
              <div className="channel-badges">
                <span className="badge badge-success">VAPI</span>
                <span className="badge badge-success">AI VOICE</span>
              </div>
            </div>
            <div className="channel-card terminal-window">
              <div className="channel-icon">🔄</div>
              <h3>BACKGROUND JOBS</h3>
              <p>Process long-running tasks with real-time notifications</p>
              <div className="channel-badges">
                <span className="badge badge-success">ASYNC</span>
                <span className="badge badge-success">TRACKING</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Integration Section - Full Screen */}
      <section 
        className="snap-section github-section"
        ref={(el) => addToRefs(el, 3)}
      >
        <div className="section-container">
          <h2 className="section-title phosphor-glow auth-page">
            GITHUB MCP INTEGRATION
          </h2>
          <div className="github-grid">
            <div className="github-card terminal-window">
              <div className="github-icon">🔱</div>
              <h3>REPOSITORY OPS</h3>
              <p>Create, fork, search repos and manage all GitHub operations from chat</p>
            </div>
            <div className="github-card terminal-window">
              <div className="github-icon">🔀</div>
              <h3>PULL REQUESTS</h3>
              <p>Auto-create PRs with generated code, manage issues and discussions</p>
            </div>
            <div className="github-card terminal-window">
              <div className="github-icon">📂</div>
              <h3>FILE MANAGEMENT</h3>
              <p>Fetch, update files, create branches and push changes seamlessly</p>
            </div>
            <div className="github-card terminal-window">
              <div className="github-icon">🤖</div>
              <h3>BOT-POWERED</h3>
              <p>No personal token needed for public repos - secure by design</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Section - Full Screen */}
      <section 
        className="snap-section agents-section"
        ref={(el) => addToRefs(el, 4)}
      >
        <div className="section-container">
          <h2 className="section-title phosphor-glow auth-page">
            SPECIALIZED AI AGENTS
          </h2>
          <div className="agents-showcase">
            <div className="agent-row">
              <div className="agent-card terminal-window">
                <div className="agent-icon">🎯</div>
                <h4>CHAT AGENT</h4>
                <p>Smart routing and orchestration</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">⚡</div>
                <h4>SIMPLE CODER</h4>
                <p>HTML/CSS/JS websites</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">🚀</div>
                <h4>COMPLEX CODER</h4>
                <p>React, TypeScript, frameworks</p>
              </div>
            </div>
            <div className="agent-row">
              <div className="agent-card terminal-window">
                <div className="agent-icon">🔧</div>
                <h4>CODE MODIFIER</h4>
                <p>Bugs, features, refactoring</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">🐛</div>
                <h4>BUG HUNTER</h4>
                <p>Deep bug detection</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">🔒</div>
                <h4>SECURITY</h4>
                <p>Vulnerability scanning</p>
              </div>
            </div>
            <div className="agent-row">
              <div className="agent-card terminal-window">
                <div className="agent-icon">⚡</div>
                <h4>PERFORMANCE</h4>
                <p>Code optimization</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">🧪</div>
                <h4>TEST CRAFTER</h4>
                <p>Comprehensive tests</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">📚</div>
                <h4>DOC WEAVER</h4>
                <p>Full documentation</p>
              </div>
              <div className="agent-card terminal-window">
                <div className="agent-icon">🐙</div>
                <h4>GITHUB AGENT</h4>
                <p>GitHub operations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Screen */}
      <section 
        className="snap-section cta-section"
        ref={(el) => addToRefs(el, 5)}
      >
        <div className="cta-container">
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
    ║        ►  PLATFORM STATUS: FULLY OPERATIONAL      ║
    ║        ►  ALL SYSTEMS: ONLINE                     ║
    ║        ►  READY FOR DEPLOYMENT                    ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝`}
              </pre>
              <h3 className="cta-title phosphor-glow auth-page">
                ACTIVATE YOUR AI ECOSYSTEM
              </h3>
              <p className="cta-text">
                Join developers using the most advanced AI-powered development platform
              </p>
              <div className="text-center">
                      <Link to="/signup" className="btn btn-primary btn-large glow-button">
                      ► ACTIVATE NOW
                      </Link>
                      <p className="text-muted mt-md">
                      No credit card required • Free tier available
                      </p>
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      </div>

      {/* Footer - Outside snap container */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-text text-muted">
            CODEFORGE AI © 2025 | NEXT-GENERATION AI DEVELOPMENT
          </div>
          <div className="footer-links">
            <a href="/docs" className="footer-link">DOCS</a>
            <span className="footer-separator">|</span>
            <a href="https://t.me/codeforge_ai_bot" className="footer-link" target="_blank" rel="noopener noreferrer">
              TELEGRAM
            </a>
            <span className="footer-separator">|</span>
            <a href="https://github.com/zaikaman/CodeForgeAI" className="footer-link">GITHUB</a>
          </div>
        </div>
      </footer>

      {/* Navigation Dots */}
      <div className="scroll-nav">
        {[...Array(totalSections)].map((_, index) => (
          <button
            key={index}
            className={`scroll-dot ${currentSection === index ? 'active' : ''}`}
            onClick={() => {
              if (!isScrolling.current && wrapperRef.current) {
                isScrolling.current = true
                setCurrentSection(index)
                gsap.to(wrapperRef.current, {
                  y: -index * window.innerHeight,
                  duration: 1.2,
                  ease: 'power2.inOut',
                  onComplete: () => {
                    isScrolling.current = false
                  },
                })
              }
            }}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
