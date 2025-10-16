import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import './DocsPage.css'

interface Section {
  id: string
  title: string
  icon: string
  content: React.ReactNode
}

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const navigate = useNavigate()

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: '📋',
      content: (
        <div className="doc-content">
          <h2>Welcome to CodeForge AI</h2>
          <p>
            CodeForge AI is a multi-agent AI system designed to automate code generation, reviews, and enhancements.
            It leverages specialized AI agents to handle different aspects of your development workflow.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Multi-Agent System</h3>
              <p>Specialized agents for code generation, review, testing, and more</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Generation</h3>
              <p>Instant code generation with live preview in your browser</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Code Review</h3>
              <p>Comprehensive code analysis covering security, performance, and style</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Deploy Anywhere</h3>
              <p>One-click deployment to fly.io or your preferred platform</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Interactive Chat</h3>
              <p>Conversational interface with your AI agents for real-time collaboration</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Live Preview</h3>
              <p>See your changes instantly with WebContainer-powered preview</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="doc-content">
          <h2>Getting Started with CodeForge AI</h2>
          
          <h3>1. Create an Account</h3>
          <p>Click on <code>Login</code> to create a new account or sign in with your existing credentials.</p>
          
          <h3>2. Accessing the Terminal</h3>
          <p>Once logged in, you'll be taken to the Terminal page - the main workspace for all your generation tasks.</p>
          
          <h3>3. Your First Generation</h3>
          <p>Start by entering a prompt in the chat input. For example:</p>
          <div className="code-example">
            <pre>Create a React component for a todo list with add, delete, and complete functionality</pre>
          </div>
          
          <h3>4. Monitor Progress</h3>
          <p>Watch as different agents work on your request. The progress panel shows:</p>
          <ul>
            <li><strong>Lead Engineer</strong> - Coordinates the overall workflow</li>
            <li><strong>Code Generators</strong> - Creates the actual code</li>
            <li><strong>Validators</strong> - Ensures code quality and correctness</li>
            <li><strong>Test Crafters</strong> - Generates test cases</li>
          </ul>
          
          <h3>5. Review Generated Code</h3>
          <p>Once generation is complete, review the code in the Source tab and preview it in the Preview tab.</p>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Core Features',
      icon: '⭐',
      content: (
        <div className="doc-content">
          <h2>Core Features</h2>
          
          <h3>🧬 Code Generation</h3>
          <p>Generate production-ready code from natural language descriptions.</p>
          <ul>
            <li>Support for multiple programming languages</li>
            <li>Configurable complexity levels (simple, moderate, complex)</li>
            <li>Automatic framework detection</li>
            <li>Image-to-code generation capability</li>
          </ul>
          
          <h3>💬 Interactive Chat</h3>
          <p>Collaborate with AI agents in real-time through a conversational interface.</p>
          <ul>
            <li>Ask follow-up questions about generated code</li>
            <li>Request modifications and improvements</li>
            <li>Background mode for long-running tasks</li>
            <li>Full chat history available in every session</li>
          </ul>
          
          <h3>🔍 Code Review</h3>
          <p>Comprehensive code analysis with specialized reviewing agents.</p>
          <ul>
            <li><strong>Security Review</strong> - Identifies vulnerabilities and security risks</li>
            <li><strong>Performance Analysis</strong> - Detects performance bottlenecks</li>
            <li><strong>Code Style</strong> - Ensures consistency and best practices</li>
            <li><strong>Bug Detection</strong> - Finds logical errors and potential bugs</li>
          </ul>
          
          <h3>✨ Code Enhancement</h3>
          <p>Improve existing code with specialized enhancement agents.</p>
          <ul>
            <li>Automatic refactoring and optimization</li>
            <li>Documentation generation</li>
            <li>Performance profiling and improvements</li>
            <li>Test case generation</li>
          </ul>
          
          <h3>🎬 Live Preview</h3>
          <p>See your web projects running in real-time with WebContainer.</p>
          <ul>
            <li>No external deployment needed for testing</li>
            <li>Instant feedback on changes</li>
            <li>Terminal access for running commands</li>
            <li>File system access and modification</li>
          </ul>
          
          <h3>🚀 Deployment</h3>
          <p>One-click deployment to production environments.</p>
          <ul>
            <li>Automatic fly.io deployment</li>
            <li>Environment configuration</li>
            <li>Live URL generation</li>
            <li>Deployment history and management</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'agents',
      title: 'AI Agents',
      icon: '🤖',
      content: (
        <div className="doc-content">
          <h2>Specialized AI Agents</h2>
          
          <div className="agent-list">
            <div className="agent-card">
              <h3>👨‍💼 Lead Engineer</h3>
              <p>Coordinates and orchestrates the entire workflow. Acts as the central intelligence that assigns tasks to other agents.</p>
            </div>
            
            <div className="agent-card">
              <h3>💻 Code Generators</h3>
              <div className="agent-types">
                <div><strong>Simple Coder</strong> - Generates straightforward code for basic requirements</div>
                <div><strong>Complex Coder</strong> - Handles advanced architectures and complex systems</div>
              </div>
            </div>
            
            <div className="agent-card">
              <h3>🛠️ Code Modification</h3>
              <p>Specialized in modifying existing code based on user feedback and requirements changes.</p>
            </div>
            
            <div className="agent-card">
              <h3>💬 Chat Agent</h3>
              <p>Handles conversational interactions and follow-up questions during the generation process.</p>
            </div>
            
            <div className="agent-card">
              <h3>🔐 Security Sentinel</h3>
              <p>Analyzes code for security vulnerabilities, injection attacks, and other security risks.</p>
            </div>
            
            <div className="agent-card">
              <h3>⚡ Performance Profiler</h3>
              <p>Identifies performance bottlenecks and suggests optimizations.</p>
            </div>
            
            <div className="agent-card">
              <h3>🐛 Bug Hunter</h3>
              <p>Detects logical errors, edge cases, and potential bugs in the code.</p>
            </div>
            
            <div className="agent-card">
              <h3>✅ Quality Assurance</h3>
              <p>Ensures overall code quality, best practices, and architectural soundness.</p>
            </div>
            
            <div className="agent-card">
              <h3>🧪 Test Crafter</h3>
              <p>Generates comprehensive test cases and testing strategies.</p>
            </div>
            
            <div className="agent-card">
              <h3>📚 Doc Weaver</h3>
              <p>Creates clear, comprehensive documentation for generated code.</p>
            </div>
            
            <div className="agent-card">
              <h3>♻️ Refactor Guru</h3>
              <p>Improves code structure, maintainability, and design patterns.</p>
            </div>
            
            <div className="agent-card">
              <h3>✔️ Code Validator</h3>
              <p>Ensures code follows language specifications and syntax rules.</p>
            </div>
            
            <div className="agent-card">
              <h3>📋 Spec Interpreter</h3>
              <p>Understands requirements and specifications from natural language descriptions.</p>
            </div>
            
            <div className="agent-card">
              <h3>🐙 GitHub Agent</h3>
              <p>Integrates with GitHub for repository analysis and code context.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'terminal-guide',
      title: 'Terminal Guide',
      icon: '⌨️',
      content: (
        <div className="doc-content">
          <h2>Terminal Page Guide</h2>
          
          <h3>Interface Layout</h3>
          <p>The Terminal page is divided into several sections:</p>
          
          <div className="layout-section">
            <h4>Left Sidebar</h4>
            <ul>
              <li><strong>New Chat</strong> - Start a new generation session</li>
              <li><strong>History</strong> - Access previous generations</li>
              <li><strong>Settings</strong> - Configure your preferences</li>
              <li><strong>Background Jobs</strong> - Monitor running tasks</li>
            </ul>
          </div>
          
          <div className="layout-section">
            <h4>Main Chat Area</h4>
            <ul>
              <li><strong>Message History</strong> - View all interactions with agents</li>
              <li><strong>Input Field</strong> - Type your prompts and follow-up messages</li>
              <li><strong>File Upload</strong> - Attach files and images</li>
              <li><strong>Progress Indicators</strong> - Real-time status of processing</li>
            </ul>
          </div>
          
          <div className="layout-section">
            <h4>Right Panel Tabs</h4>
            <ul>
              <li><strong>Source</strong> - View and edit generated code files</li>
              <li><strong>Preview</strong> - See your web project running live</li>
              <li><strong>Deploy</strong> - Deploy your project to production</li>
            </ul>
          </div>
          
          <h3>Working with Files</h3>
          <p>The Source tab shows your project structure:</p>
          <ul>
            <li>Expand/collapse folders in the file tree</li>
            <li>Click any file to view its content in the editor</li>
            <li>Make edits directly (changes are tracked)</li>
            <li>Download all files as a zip archive</li>
          </ul>
          
          <h3>Using the Preview</h3>
          <p>The Preview tab runs your project in a WebContainer:</p>
          <ul>
            <li>See live changes as you modify files</li>
            <li>Access the terminal inside the preview</li>
            <li>Install dependencies and run commands</li>
            <li>Test your application before deployment</li>
          </ul>
          
          <h3>Background Mode</h3>
          <p>Enable background mode for long-running tasks:</p>
          <ul>
            <li>Tasks continue even if you navigate away</li>
            <li>Get notifications when tasks complete</li>
            <li>Monitor progress in the Background Jobs panel</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'prompting-tips',
      title: 'Prompting Tips',
      icon: '💡',
      content: (
        <div className="doc-content">
          <h2>Effective Prompting Guide</h2>
          
          <h3>Best Practices</h3>
          
          <div className="tip-section">
            <h4>✅ Be Specific</h4>
            <p>Instead of: <code>"Create a form"</code></p>
            <p>Try: <code>"Create a React form with email and password fields, validation, and submit button styling with Tailwind CSS"</code></p>
          </div>
          
          <div className="tip-section">
            <h4>✅ Specify Technology Stack</h4>
            <p>Mention the languages, frameworks, and libraries you want:</p>
            <div className="code-example">
              <pre>"Create a REST API endpoint using Express.js with TypeScript and Mongoose for MongoDB"</pre>
            </div>
          </div>
          
          <div className="tip-section">
            <h4>✅ Include Context</h4>
            <p>Provide background information about your project:</p>
            <div className="code-example">
              <pre>"I'm building a task management app. Create a component for displaying tasks with checkboxes for completion and delete buttons"</pre>
            </div>
          </div>
          
          <div className="tip-section">
            <h4>✅ Ask for Multiple Options</h4>
            <p>Request different approaches:</p>
            <div className="code-example">
              <pre>"Generate a sorting function - try both quick sort and merge sort implementations"</pre>
            </div>
          </div>
          
          <div className="tip-section">
            <h4>✅ Specify Quality Requirements</h4>
            <p>Mention performance, security, or testing needs:</p>
            <div className="code-example">
              <pre>"Create a component that handles 1000+ items efficiently with unit tests for edge cases"</pre>
            </div>
          </div>
          
          <h3>Follow-Up Techniques</h3>
          
          <div className="tip-section">
            <h4>Modification</h4>
            <p><code>"Update the component to add dark mode support using CSS variables"</code></p>
          </div>
          
          <div className="tip-section">
            <h4>Refinement</h4>
            <p><code>"Make the animations smoother and add loading states"</code></p>
          </div>
          
          <div className="tip-section">
            <h4>Feature Addition</h4>
            <p><code>"Add a search filter to the task list and sort by priority"</code></p>
          </div>
          
          <div className="tip-section">
            <h4>Code Review Request</h4>
            <p><code>"Review this code for performance issues and suggest optimizations"</code></p>
          </div>
        </div>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: '🔌',
      content: (
        <div className="doc-content">
          <h2>API Reference</h2>
          
          <h3>Authentication</h3>
          <p>All API requests require authentication via bearer token:</p>
          <div className="code-example">
            <pre>Authorization: Bearer YOUR_ACCESS_TOKEN</pre>
          </div>
          
          <h3>Endpoints</h3>
          
          <div className="endpoint">
            <h4>POST /api/generate</h4>
            <p>Start a code generation job</p>
            <div className="code-example">
              <pre>{`{
  "prompt": "Create a React button component",
  "complexity": "moderate",
  "agents": ["CodeGenerator"]
}`}</pre>
            </div>
          </div>
          
          <div className="endpoint">
            <h4>POST /api/chat</h4>
            <p>Send a message to interact with agents during a generation</p>
            <div className="code-example">
              <pre>{`{
  "generationId": "uuid",
  "message": "Add error handling to this function",
  "currentFiles": []
}`}</pre>
            </div>
          </div>
          
          <div className="endpoint">
            <h4>POST /api/review</h4>
            <p>Review code with specialized agents</p>
            <div className="code-example">
              <pre>{`{
  "code": "const sum = (a,b) => a + b;",
  "language": "typescript",
  "options": {
    "checkSecurity": true,
    "checkPerformance": true,
    "checkStyle": true,
    "checkBugs": true
  }
}`}</pre>
            </div>
          </div>
          
          <div className="endpoint">
            <h4>POST /api/deploy</h4>
            <p>Deploy a project to fly.io</p>
            <div className="code-example">
              <pre>{`{
  "projectId": "uuid",
  "platform": "fly.io",
  "files": []
}`}</pre>
            </div>
          </div>
          
          <div className="endpoint">
            <h4>GET /api/status</h4>
            <p>Check the status of a generation or job</p>
          </div>
          
          <div className="endpoint">
            <h4>GET /api/history</h4>
            <p>Retrieve your generation history</p>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      content: (
        <div className="doc-content">
          <h2>Troubleshooting Guide</h2>
          
          <h3>Common Issues</h3>
          
          <div className="issue">
            <h4>❌ Generation Failed</h4>
            <p><strong>Solution:</strong></p>
            <ul>
              <li>Check that your prompt is clear and specific</li>
              <li>Ensure the complexity level is appropriate</li>
              <li>Try refreshing the page and submitting again</li>
              <li>Check your internet connection</li>
            </ul>
          </div>
          
          <div className="issue">
            <h4>❌ Preview Not Loading</h4>
            <p><strong>Solution:</strong></p>
            <ul>
              <li>Ensure the generated code is valid</li>
              <li>Check the browser console for errors (F12)</li>
              <li>Verify that all dependencies are installed in the preview terminal</li>
              <li>Try clearing browser cache and reloading</li>
            </ul>
          </div>
          
          <div className="issue">
            <h4>❌ Deployment Failed</h4>
            <p><strong>Solution:</strong></p>
            <ul>
              <li>Ensure you have fly.io credentials configured</li>
              <li>Check that your app has a valid Dockerfile or config</li>
              <li>Review logs in the deployment panel</li>
              <li>Verify environment variables are set correctly</li>
            </ul>
          </div>
          
          <div className="issue">
            <h4>❌ Authentication Issues</h4>
            <p><strong>Solution:</strong></p>
            <ul>
              <li>Clear browser cookies and sign in again</li>
              <li>Check that your account is verified</li>
              <li>Try signing in from an incognito/private window</li>
              <li>Ensure JavaScript is enabled in your browser</li>
            </ul>
          </div>
          
          <div className="issue">
            <h4>❌ Chat Not Responding</h4>
            <p><strong>Solution:</strong></p>
            <ul>
              <li>Check that you're connected to the internet</li>
              <li>Verify that the background job is running (check Background Jobs panel)</li>
              <li>Try enabling Background Mode for long-running tasks</li>
              <li>Reload the page if stuck for more than 5 minutes</li>
            </ul>
          </div>
          
          <h3>Getting Help</h3>
          <ul>
            <li>Check the Settings panel for your account and preferences</li>
            <li>Review your chat history for similar tasks</li>
            <li>Try with a simpler prompt first to isolate the issue</li>
            <li>Contact support with your generation ID for debugging</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      icon: '🎯',
      content: (
        <div className="doc-content">
          <h2>Advanced Features</h2>
          
          <h3>GitHub Integration</h3>
          <p>Connect your GitHub account to:</p>
          <ul>
            <li>Analyze existing repositories</li>
            <li>Generate code based on repository context</li>
            <li>Create pull requests with AI-generated improvements</li>
            <li>Enhance code with knowledge of your coding style</li>
          </ul>
          
          <h3>Background Mode</h3>
          <p>Enable background processing for tasks that take longer:</p>
          <ul>
            <li>Submit a task and continue working immediately</li>
            <li>Track progress in the Background Jobs panel</li>
            <li>Receive notifications when complete</li>
            <li>Results are saved to your history automatically</li>
          </ul>
          
          <h3>Image-to-Code</h3>
          <p>Upload images of UI designs to generate code:</p>
          <ul>
            <li>Take screenshots or use design mockups</li>
            <li>AI analyzes the design and generates HTML/CSS/React</li>
            <li>Perfect for rapid prototyping</li>
            <li>Refine the generated code in subsequent prompts</li>
          </ul>
          
          <h3>Custom Agents</h3>
          <p>Configure which agents participate in your workflow:</p>
          <ul>
            <li>Select specific agents for faster processing</li>
            <li>Focus on particular aspects (security, performance, testing)</li>
            <li>Skip unnecessary agents to save time</li>
          </ul>
          
          <h3>Project Context</h3>
          <p>Provide project context for better code generation:</p>
          <ul>
            <li>Describe your project architecture</li>
            <li>Specify tech stack and frameworks</li>
            <li>Include style guides and conventions</li>
            <li>Reference existing code patterns</li>
          </ul>
          
          <h3>Voice Interactions (Vapi Integration)</h3>
          <p>Use voice commands to interact with the system:</p>
          <ul>
            <li>Speak your prompts and requests</li>
            <li>Real-time conversation with AI agents</li>
            <li>Hands-free code generation and modification</li>
          </ul>
          
          <h3>Theme Customization</h3>
          <p>Personalize your experience:</p>
          <ul>
            <li>Choose between different color themes</li>
            <li>Enable/disable sound effects</li>
            <li>Adjust UI density and preferences</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: '🏆',
      content: (
        <div className="doc-content">
          <h2>Best Practices</h2>
          
          <h3>🎯 Generation Workflow</h3>
          <ol>
            <li>Start with a clear, specific prompt</li>
            <li>Review the initial generation</li>
            <li>Use follow-up prompts to refine and improve</li>
            <li>Request code review from specialized agents</li>
            <li>Test in the preview before deployment</li>
            <li>Deploy when satisfied with the results</li>
          </ol>
          
          <h3>✅ Code Review Process</h3>
          <ol>
            <li>Always request a code review before deployment</li>
            <li>Address security findings first</li>
            <li>Fix performance bottlenecks</li>
            <li>Apply style and best practice suggestions</li>
            <li>Add tests for critical functionality</li>
          </ol>
          
          <h3>🔒 Security</h3>
          <ul>
            <li>Never share your API tokens or auth credentials</li>
            <li>Keep your GitHub token secure</li>
            <li>Review generated code for security issues</li>
            <li>Don't deploy untested code to production</li>
            <li>Use environment variables for sensitive data</li>
          </ul>
          
          <h3>⚡ Performance Optimization</h3>
          <ul>
            <li>Request performance profiling for critical functions</li>
            <li>Optimize database queries early</li>
            <li>Use caching strategically</li>
            <li>Monitor your generated applications in production</li>
            <li>Iterate based on real user feedback</li>
          </ul>
          
          <h3>📚 Documentation</h3>
          <ul>
            <li>Request documentation generation alongside code</li>
            <li>Keep README files up to date</li>
            <li>Add inline comments for complex logic</li>
            <li>Document API endpoints and their usage</li>
          </ul>
          
          <h3>🧪 Testing</h3>
          <ul>
            <li>Always request test generation with code</li>
            <li>Test edge cases and error scenarios</li>
            <li>Use the preview to test before deployment</li>
            <li>Maintain test coverage above 80%</li>
          </ul>
        </div>
      ),
    },
  ]

  return (
    <div className="docs-page crt-screen">
      <div className="docs-container">
        {/* Header */}
        <div className="docs-header">
          <div className="docs-title-section">
            <h1>📚 CodeForge AI Documentation</h1>
            <p>Complete guide to AI-powered code generation and enhancement</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/terminal')}>
            Go to Terminal →
          </button>
        </div>

        <div className="docs-layout">
          {/* Sidebar Navigation */}
          <nav className="docs-sidebar">
            <div className="docs-sidebar-header">
              <h3>Sections</h3>
            </div>
            <ul className="docs-sidebar-menu">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    className={`docs-sidebar-link ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className="docs-section-icon">{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="docs-main">
            <div className="docs-content-wrapper">
              {sections.find((s) => s.id === activeSection)?.content}
            </div>

            {/* Footer Navigation */}
            <div className="docs-footer">
              <div className="docs-footer-nav">
                {activeSection !== 'overview' && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const currentIndex = sections.findIndex((s) => s.id === activeSection)
                      if (currentIndex > 0) setActiveSection(sections[currentIndex - 1].id)
                    }}
                  >
                    ← Previous
                  </button>
                )}
                {activeSection !== sections[sections.length - 1].id && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const currentIndex = sections.findIndex((s) => s.id === activeSection)
                      if (currentIndex < sections.length - 1) setActiveSection(sections[currentIndex + 1].id)
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
              <div className="docs-footer-info">
                <p>CodeForge AI v1.0.0 | Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
