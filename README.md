# CodeForge AI 🤖

<div align="center">

![CodeForge AI](https://files.catbox.moe/vumztw.png)

**Next-Generation Multi-Agent AI Development Platform**

*Your Virtual Development Team Powered by Specialized AI Agents*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)

[🚀 Live Demo](https://codeforge-ai.vercel.app) | [📚 Documentation](https://codeforge-ai.vercel.app/docs) | [💬 Telegram Bot](https://t.me/codeforge_ai_bot)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Multi-Channel Access](#-multi-channel-access)
- [AI Agents](#-ai-agents)
- [AI Image Generation](#-ai-image-generation)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**CodeForge AI** is a cutting-edge multi-agent AI system that revolutionizes code generation, reviews, and enhancements. Built on the [ADK-TS framework](https://adk.iqai.com), it provides a complete AI-powered development ecosystem with specialized agents, multi-channel access, and seamless GitHub integration.

### Why CodeForge AI?

- 🤖 **10+ Specialized AI Agents** - From simple HTML to complex TypeScript applications
- 🎨 **AI Image Generation** - Create product images and visual assets on-demand
- 🔄 **4 Access Channels** - Web Terminal, Telegram Bot, Voice Commands, Background Jobs
- 🐙 **GitHub MCP Integration** - Full repository operations without personal tokens
- ⚡ **Real-Time Preview** - WebContainer-powered live preview and deployment
- 🎤 **Voice Commands** - VAPI integration for hands-free coding experience

---

## 🏆 ADK-TS Hackathon 2025

**CodeForge AI** is an official submission to the **ADK-TS Hackathon 2025**, competing in two primary tracks:

### 🎯 Track 1: MCP Expansion - GitHub MCP Server
We've developed a comprehensive **GitHub Model Context Protocol (MCP) Server** that extends AI agents with full GitHub capabilities:
- ✅ Repository operations (create, fork, search, clone)
- ✅ Pull request management and creation
- ✅ File operations with direct GitHub API integration
- ✅ Issue and discussion management
- ✅ Secure bot-powered access (no personal tokens required)

**Source**: [`backend/src/mcp-servers/github-mcp.ts`](backend/src/mcp-servers/github-mcp.ts)

### 🎯 Track 2: ADK-TS Agents - Full Multi-Agent System
The complete CodeForge AI platform demonstrates advanced agent orchestration:
- ✅ 10+ specialized AI agents with intelligent routing
- ✅ Multi-agent workflows for complex code generation tasks
- ✅ Real-time agent collaboration and state management
- ✅ Integration with multiple AI providers (OpenAI, Anthropic, Google)
- ✅ Production-ready multi-channel deployment
- ✅ **Telegram Bot Integration** ([@CodeForgeAI_Bot](https://t.me/codeforge_ai_bot)) - Full AI capabilities available on mobile

### 🚀 ADK-TS Framework Improvements
We've contributed meaningful enhancements to ADK-TS:

1. **Context Variable Injection Fix** 
   - Fixed template variable handling for prompts containing special patterns like `{{ useState }}`
   - Ensures proper variable substitution without breaking JSX-like syntax
   - Enables more complex agent prompt templates

2. **GPT-5 Model Support**
   - Added support for latest GPT-5 models
   - Improved response quality and token efficiency
   - Better cost optimization for production workloads

3. **Custom OpenAI Base URL Override**
   - Allows configuration of custom OpenAI-compatible API endpoints
   - Enables enterprise proxy support and alternative LLM providers
   - Flexible API configuration for different deployment scenarios

**Related Files**: 
- [`backend/src/agents/`](backend/src/agents/) - Agent implementations
- [`backend/src/workflows/`](backend/src/workflows/) - Workflow orchestration
- [`adk-ts/packages/adk/`](adk-ts/packages/adk/) - ADK-TS framework integration

---

## ✨ Key Features

### 🧬 Intelligent Code Generation

Generate production-ready code from natural language descriptions:

- **Multiple Programming Languages**: TypeScript, JavaScript, React, HTML/CSS, and more
- **Complexity Levels**: Simple, moderate, and complex generation modes
- **Automatic Framework Detection**: Smart detection of target frameworks and libraries
- **Context-Aware Generation**: Learns from your project structure and coding style
- **Image-to-Code Conversion**: Upload UI mockups and get working code

### 🎨 AI Image Generation *(NEW!)*

CodeForge AI now includes built-in AI image generation powered by **Runware's high-performance API**:

- **Fast Generation**: WebSocket-based real-time processing with model `runware:101@1`
- **Product Photo Generation**: Create professional product images for e-commerce sites
- **Hero Images & Backgrounds**: Generate stunning visuals for landing pages
- **On-Demand Creation**: Agents automatically generate images when needed
- **Automatic Cloud Upload**: Images are uploaded to Supabase and ready to use
- **No External Dependencies**: All image generation handled internally

**How It Works:**
```typescript
// Agents automatically call the image generation tool
// Example: "Create a shoe store website with product images"
// Result: AI generates unique product photos for each item using Runware
```

### Use Cases

```typescript
// 1. E-Commerce Product Images
"Create a shoe store website"
// → Generates unique product photos for each shoe

// 2. Hero Images for Landing Pages
"Build a SaaS landing page"
// → Creates professional hero images and backgrounds

// 3. UI Elements and Icons
"Design a dashboard with custom icons"
// → Generates matching icon sets

// 4. Marketing Materials
"Create a portfolio website"
// → Generates project thumbnails and visuals
```

### Technical Details

- **Provider**: Runware API
- **Model**: runware:101@1 (Stable Diffusion optimized for speed)
- **Resolution**: 1024x1024 (configurable)
- **Format**: PNG
- **Storage**: Supabase Storage
- **Access**: Public URLs with CDN
- **Connection**: WebSocket (persistent, efficient)
- **Performance**: Fast generation with real-time processing

### Agent Integration

All code generation agents have access to the image generation tool:

```typescript
// SimpleCoderAgent - HTML/CSS/JS projects
// ComplexCoderAgent - React/TypeScript projects
// CodeModificationAgent - Adding images to existing code

// Agents automatically:
// 1. Identify need for images
// 2. Generate detailed prompts
// 3. Call image generation tool (Runware)
// 4. Integrate URLs into code
// 5. Add proper styling and alt text
```

### Example Workflow

```bash
User: "Create an e-commerce site for sneakers"

Agent Process:
1. ✅ Generate HTML structure
2. 🎨 Call generate_image 6 times with unique prompts using Runware:
   - "Professional product photo of red running shoes..."
   - "Professional product photo of black sneakers..."
   - "Professional product photo of white athletic shoes..."
3. 📦 Receive public URLs
4. 🔗 Integrate into HTML/React code
5. ✨ Apply responsive styling

Result: Fully functional website with AI-generated product images!
```

### 💬 Interactive Chat Interface

Collaborate with AI agents in real-time:

- **Conversational Workflow**: Natural language interactions with agents
- **Follow-Up Requests**: Modify and improve code iteratively
- **Background Mode**: Long-running tasks with notifications
- **Full Chat History**: Context retention across sessions
- **File Upload Support**: Attach images and design mockups

### 🔍 Comprehensive Code Review

Multi-perspective analysis with specialized reviewing agents:

- **Security Analysis**: Identify vulnerabilities and security risks
- **Performance Profiling**: Detect bottlenecks and optimization opportunities
- **Code Style Enforcement**: Ensure consistency and best practices
- **Bug Detection**: Find logical errors and edge cases
- **Actionable Feedback**: Specific line numbers and fix suggestions

### 🎬 Live Preview & Deployment

See your code running in real-time:

- **WebContainer Integration**: Instant browser-based preview
- **Terminal Access**: Run commands and install dependencies
- **File System**: Full file editing and management
- **One-Click Deployment**: Deploy to Fly.io or your preferred platform
- **Environment Configuration**: Secure environment variable management

### 🐙 GitHub MCP Integration

Seamless GitHub operations powered by Model Context Protocol:

- **Repository Operations**: Create, fork, search, and manage repositories
- **Pull Request Management**: Auto-create PRs with generated code
- **File Operations**: Read, update, and push changes
- **Issue & Discussion Management**: Full project management capabilities
- **Secure by Design**: Bot-powered access for public repos (no personal token needed)

---

## 🌐 Multi-Channel Access

### 1️⃣ Web Terminal 🖥️

Full-featured web interface with live preview:

```bash
# Access at https://codeforge-ai.vercel.app/terminal
- Real-time code generation
- Live WebContainer preview
- File management and editing
- Background job tracking
```

### 2️⃣ Telegram Bot 💬

Code on the go with mobile access:

```bash
# Start chatting with @CodeForgeAI_Bot
/start - Initialize bot
/generate - Generate code
/review - Review code
/status - Check job status
```

### 3️⃣ Voice Commands 🎤

Hands-free coding with VAPI integration:

```bash
# Just speak your requests
"Create a React button component"
"Add dark mode to the website"
"Review this code for security issues"
```

### 4️⃣ Background Jobs 🔄

Process long-running tasks asynchronously:

```bash
# Submit tasks and continue working
- Real-time progress tracking
- Desktop notifications
- Automatic result saving
```

---

## 🤖 AI Agents

CodeForge AI employs 10+ specialized AI agents, each with unique expertise:

### Core Agents

| Agent | Role | Specialty |
|-------|------|-----------|
| 💬 **Chat Agent** | Orchestrator | Smart routing and conversation management |
| ⚡ **Simple Coder** | Generator | HTML/CSS/Vanilla JS websites |
| 🚀 **Complex Coder** | Generator | React, TypeScript, advanced frameworks |
| 🔧 **Code Modifier** | Enhancer | Bugs, features, refactoring |

### Review & Quality Agents

| Agent | Role | Focus Area |
|-------|------|-----------|
| 🔒 **Security Sentinel** | Reviewer | Vulnerability scanning and security |
| ⚡ **Performance Profiler** | Optimizer | Performance analysis and optimization |
| 🐛 **Bug Hunter** | Debugger | Logical errors and edge cases |
| ✅ **Quality Assurance** | Validator | Best practices and architecture |

### Support Agents

| Agent | Role | Capability |
|-------|------|-----------|
| 🧪 **Test Crafter** | Tester | Comprehensive test generation |
| 📚 **Doc Weaver** | Writer | Documentation and comments |
| 🐙 **GitHub Agent** | Integrator | Repository operations and analysis |

---

## 🎨 AI Image Generation

### Overview

CodeForge AI includes a powerful AI image generation system that uses **HuggingFace's Stable Diffusion 3.5 Large Turbo** to create high-quality images on-demand.

### Features

- **Automatic Generation**: Agents automatically create images when building visual-heavy websites
- **Detailed Prompts**: Smart prompt engineering for professional-looking results
- **Multiple Images**: Generate multiple variations for product galleries
- **Cloud Storage**: Images automatically uploaded to Supabase Storage
- **Public URLs**: Ready-to-use URLs for immediate integration
- **Fallback Handling**: Graceful degradation with CSS placeholders if generation fails

### Use Cases

```typescript
// 1. E-Commerce Product Images
"Create a shoe store website"
// → Generates unique product photos for each shoe

// 2. Hero Images for Landing Pages
"Build a SaaS landing page"
// → Creates professional hero images and backgrounds

// 3. UI Elements and Icons
"Design a dashboard with custom icons"
// → Generates matching icon sets

// 4. Marketing Materials
"Create a portfolio website"
// → Generates project thumbnails and visuals
```

### Technical Details

- **Model**: Stable Diffusion 3.5 Large Turbo
- **Resolution**: 1024x1024 (configurable)
- **Format**: PNG
- **Storage**: Supabase Storage
- **Access**: Public URLs with CDN
- **Performance**: ~4 inference steps, ~2-3 seconds per image

### Agent Integration

All code generation agents have access to the image generation tool:

```typescript
// SimpleCoderAgent - HTML/CSS/JS projects
// ComplexCoderAgent - React/TypeScript projects
// CodeModificationAgent - Adding images to existing code

// Agents automatically:
// 1. Identify need for images
// 2. Generate detailed prompts
// 3. Call image generation tool
// 4. Integrate URLs into code
// 5. Add proper styling and alt text
```

### Example Workflow

```bash
User: "Create an e-commerce site for sneakers"

Agent Process:
1. ✅ Generate HTML structure
2. 🎨 Call generate_image 6 times with unique prompts:
   - "Professional product photo of red running shoes..."
   - "Professional product photo of black sneakers..."
   - "Professional product photo of white athletic shoes..."
3. 📦 Receive public URLs
4. 🔗 Integrate into HTML/React code
5. ✨ Apply responsive styling

Result: Fully functional website with AI-generated product images!
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CodeForge AI Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Web Terminal │  │ Telegram Bot │  │ Voice (VAPI) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                  ┌─────────▼─────────┐                       │
│                  │   API Gateway     │                       │
│                  │   (Express.js)    │                       │
│                  └─────────┬─────────┘                       │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼─────┐       │
│  │   Agent     │  │    Workflow     │  │  Storage  │       │
│  │  Orchestr.  │  │    Engine       │  │ (Supabase)│       │
│  └──────┬──────┘  └────────┬────────┘  └───────────┘       │
│         │                  │                                 │
│  ┌──────▼──────────────────▼────────┐                       │
│  │      Multi-Agent System          │                       │
│  │  ┌────────────────────────────┐  │                       │
│  │  │  Chat • Simple • Complex   │  │                       │
│  │  │  Modifier • Security       │  │                       │
│  │  │  Performance • Testing     │  │                       │
│  │  │  GitHub • Documentation    │  │                       │
│  │  └────────────────────────────┘  │                       │
│  └─────────────────────────────────┘                        │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │         External Integrations                │            │
│  │  • ADK-TS Framework                          │            │
│  │  • GitHub MCP Server                         │            │
│  │  • HuggingFace Stable Diffusion              │            │
│  │  • WebContainer API                          │            │
│  │  • VAPI Voice Assistant                      │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI framework
- **TypeScript 5.3** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **WebContainer API** - Browser-based runtime
- **Socket.io Client** - Real-time communication
- **Zustand** - State management

### Backend
- **Node.js 20.x** - Runtime environment
- **Express.js 4.18** - Web framework
- **TypeScript 5.3** - Type safety
- **Socket.io** - WebSocket server
- **Bull** - Job queue management
- **Redis (IORedis)** - Caching and queue
- **ADK-TS** - AI agent framework

### AI & Integrations
- **ADK-TS** - Multi-agent framework
- **OpenAI GPT-4** - Primary LLM
- **Anthropic Claude** - Alternative LLM
- **Google Gemini** - Alternative LLM
- **Runware API** - High-performance image generation (model: runware:101@1)
- **GitHub MCP Server** - Repository integration
- **VAPI** - Voice assistant integration

### Database & Storage
- **Supabase** - PostgreSQL database
- **Supabase Storage** - File and image storage
- **Redis** - Caching and sessions

### DevOps & Deployment
- **Vercel** - Frontend hosting
- **Heroku** - Backend hosting
- **Fly.io** - Generated project deployment
- **GitHub Actions** - CI/CD
- **Docker** - Containerization

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Redis** (for job queue)
- **Supabase Account** (for database and storage)
- **API Keys**:
  - OpenAI API key (or Anthropic/Google)
  - Runware API key (for image generation)
  - GitHub token (optional, for GitHub integration)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/zaikaman/CodeForgeAI.git
cd CodeForgeAI
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

**Backend (.env)**
```env
# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Runware (for image generation)
RUNWARE_API_KEY=your_runware_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# GitHub (optional)
GITHUB_TOKEN=your_github_token

# VAPI (optional)
VAPI_API_KEY=your_vapi_key
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
```

4. **Set up database**

```bash
# Run Supabase migrations
cd supabase
supabase db push
```

5. **Start Redis server**

```bash
redis-server
```

6. **Build ADK package**

```bash
npm run prepare-adk
```

### Running Locally

**Development mode (recommended)**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production mode**

```bash
# Build all packages
npm run build

# Start backend
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm run preview
```

### Access the Application

- **Web Terminal**: http://localhost:5173/terminal
- **Documentation**: http://localhost:5173/docs
- **API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

---

## 📖 Usage Examples

### Example 1: Generate a React Component

```typescript
// In the Web Terminal or via API

Prompt: "Create a responsive navbar component in React with 
logo, menu items, and mobile hamburger menu using Tailwind CSS"

Result:
- ✅ Complete React component with TypeScript
- ✅ Tailwind CSS styling
- ✅ Mobile-responsive design
- ✅ Proper component structure
- ✅ Example usage documentation
```

### Example 2: E-Commerce Site with AI Images

```typescript
Prompt: "Create a shoe store website with 6 products"

Agent Process:
1. Generate HTML/CSS structure
2. Call image generation 6 times:
   - "Professional product photo of red Nike running shoes on white background"
   - "Professional product photo of black leather dress shoes on white background"
   - (4 more unique prompts)
3. Integrate all image URLs
4. Add product details and styling

Result:
- ✅ Complete e-commerce site
- ✅ 6 unique AI-generated product images
- ✅ Responsive grid layout
- ✅ Shopping cart functionality
```

### Example 3: Code Review

```typescript
// Request a security review

Prompt: "Review this authentication code for security vulnerabilities"
[Paste code]

Result:
- 🔒 Security analysis
- ⚡ Performance suggestions
- 🐛 Bug detection
- ✨ Best practice recommendations
- 📝 Line-by-line feedback
```

### Example 4: Telegram Bot Usage

```bash
# Chat with @CodeForgeAI_Bot

/start
Bot: "Welcome to CodeForge AI! How can I help you code today?"

You: "Create a Python function to calculate Fibonacci sequence"

Bot: [Generates code]
```
<file_code>
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib
```

### Example 5: Voice Commands

```bash
# Using VAPI integration

You: [Voice] "Create a login form with email and password"

AI: [Voice response] "Creating a login form for you..."

Result: Complete form component appears in your workspace
```

---

## 🔌 API Reference

### Authentication

All API requests require authentication via bearer token:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Core Endpoints

#### POST `/api/generate`

Generate code from natural language prompt.

**Request:**
```json
{
  "prompt": "Create a React button component",
  "complexity": "moderate",
  "agents": ["CodeGenerator"],
  "imageUrls": [],
  "autoPreview": false
}
```

**Response:**
```json
{
  "id": "gen_123",
  "status": "processing",
  "message": "Generation started"
}
```

#### POST `/api/chat`

Send follow-up messages during generation.

**Request:**
```json
{
  "generationId": "gen_123",
  "message": "Add dark mode support",
  "currentFiles": []
}
```

#### POST `/api/review`

Review code with specialized agents.

**Request:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "options": {
    "checkSecurity": true,
    "checkPerformance": true,
    "checkStyle": true,
    "checkBugs": true
  }
}
```

#### POST `/api/images/generate`

Generate AI images using Runware (internal use by agents).

**Request:**
```json
{
  "prompt": "Professional product photo of red shoes on white background",
  "userId": "user_123",
  "width": 1024,
  "height": 1024
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://supabase.co/storage/.../image.png",
  "imagePath": "user_123/generated/image.png",
  "seed": 12345,
  "cost": 0.005
}
```

#### POST `/api/deploy`

Deploy project to Fly.io.

**Request:**
```json
{
  "projectId": "gen_123",
  "platform": "fly.io",
  "files": []
}
```

#### GET `/api/status/:id`

Check generation status.

#### GET `/api/history`

Retrieve generation history.

**Response:**
```json
{
  "history": [
    {
      "id": "gen_123",
      "prompt": "Create a todo app",
      "status": "completed",
      "createdAt": "2025-10-17T10:00:00Z"
    }
  ]
}
```

### WebSocket Events

Connect to `ws://localhost:3001` or `wss://your-domain.com`

**Events:**
- `generation:progress` - Real-time generation updates
- `generation:complete` - Generation finished
- `generation:error` - Error occurred
- `chat:message` - New chat message
- `agent:update` - Agent status update

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Backend (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set SUPABASE_URL=your_url
# ... set all required env vars

# Deploy
git push heroku main
```

### Generated Projects (Fly.io)

Projects generated by CodeForge AI can be deployed with one click to Fly.io:

```bash
# Automatic deployment via Deploy tab in Web Terminal
# Or manual deployment:

flyctl launch
flyctl deploy
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier (configs included)
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[ADK-TS](https://adk.iqai.com)** - Agent Development Kit framework
- **[OpenAI](https://openai.com)** - GPT-4 language model
- **[Anthropic](https://anthropic.com)** - Claude language model
- **[Google](https://ai.google)** - Gemini language model
- **[Runware](https://runware.ai)** - High-performance image generation API
- **[Supabase](https://supabase.com)** - Database and storage
- **[Vercel](https://vercel.com)** - Frontend hosting
- **[WebContainer API](https://webcontainers.io)** - Browser-based runtime

---

## 📞 Support

- **Documentation**: [https://codeforge-ai.vercel.app/docs](https://codeforge-ai.vercel.app/docs)
- **Telegram Bot**: [@CodeForgeAI_Bot](https://t.me/codeforge_ai_bot)
- **GitHub Issues**: [Report bugs or request features](https://github.com/zaikaman/CodeForgeAI/issues)
- **Email**: support@codeforge.ai

---

## 🗺️ Roadmap

### Q4 2025
- [ ] VS Code extension
- [ ] Additional LLM providers
- [ ] Enhanced GitHub integration
- [ ] Team collaboration features

### Q1 2026
- [ ] Self-hosted option
- [ ] Custom agent creation
- [ ] API rate limiting dashboard
- [ ] Advanced analytics

### Q2 2026
- [ ] Mobile apps (iOS/Android)
- [ ] Plugin marketplace
- [ ] Enterprise features
- [ ] Multi-language support

---

<div align="center">

**Built with ❤️ by the CodeForge AI Team**

[Website](https://codeforge-ai.vercel.app) • [Docs](https://codeforge-ai.vercel.app/docs) • [GitHub](https://github.com/zaikaman/CodeForgeAI) • [Telegram](https://t.me/codeforge_ai_bot)

⭐ Star us on GitHub if you find this project useful!

</div>
