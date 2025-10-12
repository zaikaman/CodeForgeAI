# GitHub MCP Server

**Advanced Model Context Protocol server for GitHub operations**

Built for the MCP Hackathon - Track 1: MCP Expansion

## 🎯 Overview

The GitHub MCP Server is a comprehensive integration that enables AI agents to interact with GitHub repositories autonomously. It provides 30+ tools covering all major GitHub operations, from basic repository management to advanced code review and workflow automation.

## ✨ Key Features

### Core GitHub Operations
- **Repository Management**: Get info, fork, list collaborators
- **Issue Management**: Create, update, list, search, and comment on issues
- **Pull Request Management**: Create, merge, review, and analyze PRs
- **Branch Operations**: Create, delete, and list branches
- **File Operations**: Read, write, and search code
- **Commit Management**: List commits, view diffs
- **GitHub Actions**: List runs, trigger workflows

### 🤖 AI-Powered Features (Optional)
When AI features are enabled, the server provides:
- **Smart PR Descriptions**: AI-generated comprehensive PR descriptions
- **Code Change Analysis**: Automated complexity assessment and suggestions
- **Issue Label Suggestions**: Intelligent label recommendations
- **Automated Code Review**: AI-powered code review with inline comments

## 🚀 Quick Start

### 1. Setup

```bash
# Install dependencies
cd backend
npm install

# Configure GitHub token
echo "GITHUB_TOKEN=your_github_token_here" >> .env
```

### 2. Create GitHub Token

Create a fine-grained personal access token at:
https://github.com/settings/personal-access-tokens/new

**Required permissions:**
- Contents: Read and write
- Issues: Read and write
- Pull requests: Read and write
- Workflows: Read and write (optional)

### 3. Use in Code

```typescript
import { createGitHubMcpServer } from './mcp-servers/github'

// Create server instance
const server = createGitHubMcpServer({
  token: process.env.GITHUB_TOKEN!,
  owner: 'your-username',
  repo: 'your-repo',
  enableAIFeatures: false, // Set to true for AI-powered features
})

// Get repository info
const repoInfo = await server.executeTool('get_repository_info', {
  owner: 'octocat',
  repo: 'Hello-World'
})

// Create an issue
const issue = await server.executeTool('create_issue', {
  title: 'Found a bug',
  body: 'Description of the bug',
  labels: ['bug', 'priority-high']
})

// Create a pull request
const pr = await server.executeTool('create_pull_request', {
  title: 'Fix: Resolve issue #123',
  body: 'This PR fixes the bug described in #123',
  head: 'feature-branch',
  base: 'main'
})
```

### 4. Run Demo

```bash
# Run demo on your repository
npm run dev src/github-mcp-demo.ts your-username your-repo

# Run demo on this repository
npm run dev src/github-mcp-demo.ts zaikaman CodeForgeAI
```

## 📋 Available Tools

### Repository Operations
- `get_repository_info` - Get detailed repository information
- `fork_repository` - Fork a repository
- `list_collaborators` - List repository collaborators

### Issue Operations
- `create_issue` - Create a new issue
- `update_issue` - Update an existing issue
- `list_issues` - List issues (open/closed/all)
- `search_issues` - Search for issues

### Pull Request Operations
- `create_pull_request` - Create a new PR
- `merge_pull_request` - Merge a PR
- `review_pull_request` - Add review to a PR
- `get_pull_request_files` - Get changed files in a PR
- `list_pull_requests` - List PRs

### Branch Operations
- `create_branch` - Create a new branch
- `delete_branch` - Delete a branch
- `list_branches` - List all branches

### File Operations
- `get_file_content` - Read file content
- `create_or_update_file` - Write/update file
- `search_code` - Search code in repositories

### Commit Operations
- `list_commits` - List commit history
- `get_commit_diff` - Get diff for a commit

### Workflow Operations
- `list_workflow_runs` - List GitHub Actions runs
- `trigger_workflow` - Trigger a workflow dispatch

### AI-Powered Tools (When Enabled)
- `generate_pr_description` - AI-generated PR descriptions
- `analyze_code_changes` - AI code analysis
- `suggest_issue_labels` - AI label suggestions
- `auto_review_pr` - Automated code review

## 🔄 Pre-built Workflows

The server includes 5 pre-built workflows demonstrating autonomous AI agent capabilities:

### 1. Auto-Fix Bug Workflow
```typescript
import { autoFixBugWorkflow } from './workflows/GitHubAgentWorkflows'

const result = await autoFixBugWorkflow(
  { server, owner: 'user', repo: 'repo' },
  issueNumber
)
```

**What it does:**
1. Reads issue description
2. Creates a feature branch
3. Generates and commits fix
4. Creates pull request

### 2. Smart PR Review Workflow
```typescript
import { smartPRReviewWorkflow } from './workflows/GitHubAgentWorkflows'

const result = await smartPRReviewWorkflow(
  { server, owner: 'user', repo: 'repo' },
  prNumber
)
```

**What it does:**
1. Analyzes PR changes
2. Assesses code complexity
3. Provides improvement suggestions
4. Submits review comment

### 3. Auto-Triage Issues Workflow
```typescript
import { autoTriageIssuesWorkflow } from './workflows/GitHubAgentWorkflows'

const result = await autoTriageIssuesWorkflow({
  server,
  owner: 'user',
  repo: 'repo'
})
```

**What it does:**
1. Fetches open issues
2. Analyzes content (with AI if enabled)
3. Suggests appropriate labels
4. Updates issues

### 4. Generate Release Notes Workflow
```typescript
import { generateReleaseNotesWorkflow } from './workflows/GitHubAgentWorkflows'

const result = await generateReleaseNotesWorkflow(
  { server, owner: 'user', repo: 'repo' },
  sinceDate
)
```

**What it does:**
1. Gets commits since date
2. Categorizes (features/fixes/other)
3. Generates release notes
4. Creates documentation issue

### 5. Repository Health Check Workflow
```typescript
import { repoHealthCheckWorkflow } from './workflows/GitHubAgentWorkflows'

const result = await repoHealthCheckWorkflow({
  server,
  owner: 'user',
  repo: 'repo'
})
```

**What it does:**
1. Checks open issues/PRs
2. Analyzes workflow status
3. Calculates health score (0-100)
4. Reports metrics

## 🏗️ Architecture

```
GitHub MCP Server
├── GitHubMcpTool (Core)
│   ├── Octokit wrapper
│   └── 30+ GitHub API methods
│
├── GitHubMcpServer (MCP Layer)
│   ├── Resource definitions
│   ├── Tool registry
│   ├── Tool executor
│   └── AI service integration
│
├── Workflows
│   ├── Auto-fix bugs
│   ├── Smart PR review
│   ├── Auto-triage issues
│   ├── Generate release notes
│   └── Health check
│
└── AI Service (Optional)
    ├── Code analysis
    ├── Label suggestion
    └── Review generation
```

## 💡 Use Cases

### For Developers
- **Automated Bug Fixes**: AI agent reads issues, creates fixes, and PRs
- **Code Review Assistant**: Get instant AI-powered code reviews
- **Documentation**: Auto-generate release notes and changelogs
- **Repository Management**: Automated issue triaging and labeling

### For Teams
- **CI/CD Integration**: Trigger workflows based on repository events
- **Quality Assurance**: Automated health checks and reports
- **Onboarding**: Help new contributors understand repository structure
- **Maintenance**: Automated cleanup and organization

### For Open Source
- **Issue Management**: Auto-label and triage incoming issues
- **PR Reviews**: Provide quick feedback on contributions
- **Release Management**: Automated release note generation
- **Community Health**: Monitor and report repository metrics

## 🎨 Example: Complete Workflow

```typescript
// 1. Setup server
const server = createGitHubMcpServer({
  token: process.env.GITHUB_TOKEN!,
  owner: 'myorg',
  repo: 'myrepo',
  enableAIFeatures: true
})

// 2. Check repository health
const health = await repoHealthCheckWorkflow({ server, owner: 'myorg', repo: 'myrepo' })
console.log(`Repository health score: ${health.health.score}/100`)

// 3. Auto-triage open issues
const triage = await autoTriageIssuesWorkflow({ server, owner: 'myorg', repo: 'myrepo' })
console.log(`Triaged ${triage.triaged} issues`)

// 4. Auto-fix a bug
const fix = await autoFixBugWorkflow({ server, owner: 'myorg', repo: 'myrepo' }, 42)
console.log(`Created PR #${fix.prNumber}`)

// 5. Review the PR
const review = await smartPRReviewWorkflow({ server, owner: 'myorg', repo: 'myrepo' }, fix.prNumber!)
console.log('Review submitted')

// 6. Generate release notes
const release = await generateReleaseNotesWorkflow(
  { server, owner: 'myorg', repo: 'myrepo' },
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
)
console.log(`Release notes created in issue #${release.issueNumber}`)
```

## 🔒 Security

- **Token Security**: Never commit tokens to version control
- **Permissions**: Use fine-grained tokens with minimal required permissions
- **Rate Limiting**: Respects GitHub API rate limits
- **Error Handling**: Comprehensive error handling and logging

## 📊 Performance

- **Efficient API Usage**: Minimal API calls through smart caching
- **Batch Operations**: Support for bulk operations where possible
- **Async Operations**: Non-blocking async/await throughout
- **Token Management**: Automatic retry on rate limit errors

## 🤝 Contributing

This MCP server is part of the CodeForgeAI project. Contributions welcome!

## 📝 License

MIT License - See LICENSE file

## 🏆 MCP Hackathon Submission

**Track**: Track 1 - MCP Expansion

**What makes this special:**
1. **Comprehensive**: 30+ tools covering all GitHub operations
2. **AI-Powered**: Optional AI features for intelligent automation
3. **Production-Ready**: Full error handling, typing, and documentation
4. **Practical**: Real-world workflows demonstrating agent autonomy
5. **Extensible**: Easy to add new tools and workflows

**Innovation:**
- Combines MCP architecture with GitHub's comprehensive API
- Provides both low-level tools and high-level intelligent workflows
- Enables true autonomous agent behavior with multi-step reasoning
- Optional AI layer for intelligent decision-making

---

Built with ❤️ for the MCP Hackathon
