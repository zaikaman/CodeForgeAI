import { Octokit } from '@octokit/rest'

/**
 * GitHub MCP Tool
 * Octokit wrapper for GitHub operations
 */

export interface GitHubConfig {
  token: string
  owner?: string
  repo?: string
}

export interface GitHubRepoInfo {
  name: string
  fullName: string
  description: string
  language: string
  stars: number
  forks: number
  openIssues: number
  defaultBranch: string
  url: string
}

export interface GitHubPullRequest {
  number: number
  title: string
  body: string
  state: string
  url: string
  createdAt: string
  updatedAt: string
}

export interface GitHubIssue {
  number: number
  title: string
  body: string
  state: string
  labels: string[]
  url: string
  createdAt: string
}

export class GitHubMcpTool {
  private octokit: Octokit
  private owner?: string
  private repo?: string

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.token,
    })
    this.owner = config.owner
    this.repo = config.repo
  }

  /**
   * Get repository information
   */
  async getRepoInfo(owner?: string, repo?: string): Promise<GitHubRepoInfo> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.repos.get({
      owner: repoOwner,
      repo: repoName,
    })

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      language: data.language || 'Unknown',
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      url: data.html_url,
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    path: string,
    ref?: string,
    owner?: string,
    repo?: string
  ): Promise<string> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path,
      ref,
    })

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path ${path} is not a file`)
    }

    if (!data.content) {
      throw new Error(`File ${path} has no content`)
    }

    return Buffer.from(data.content, 'base64').toString('utf-8')
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string,
    owner?: string,
    repo?: string
  ): Promise<GitHubPullRequest> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.pulls.create({
      owner: repoOwner,
      repo: repoName,
      title,
      body,
      head,
      base,
    })

    return {
      number: data.number,
      title: data.title,
      body: data.body || '',
      state: data.state,
      url: data.html_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * List pull requests
   */
  async listPullRequests(
    state: 'open' | 'closed' | 'all' = 'open',
    owner?: string,
    repo?: string
  ): Promise<GitHubPullRequest[]> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.pulls.list({
      owner: repoOwner,
      repo: repoName,
      state,
    })

    return data.map(pr => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state,
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    }))
  }

  /**
   * Create an issue
   */
  async createIssue(
    title: string,
    body: string,
    labels?: string[],
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.issues.create({
      owner: repoOwner,
      repo: repoName,
      title,
      body,
      labels,
    })

    return {
      number: data.number,
      title: data.title,
      body: data.body || '',
      state: data.state,
      labels: data.labels.map(l => (typeof l === 'string' ? l : l.name || '')),
      url: data.html_url,
      createdAt: data.created_at,
    }
  }

  /**
   * List issues
   */
  async listIssues(
    state: 'open' | 'closed' | 'all' = 'open',
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue[]> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.issues.listForRepo({
      owner: repoOwner,
      repo: repoName,
      state,
    })

    return data.map(issue => ({
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state,
      labels: issue.labels.map(l => (typeof l === 'string' ? l : l.name || '')),
      url: issue.html_url,
      createdAt: issue.created_at,
    }))
  }

  /**
   * Get commits for a repository
   */
  async listCommits(
    options: {
      sha?: string
      path?: string
      author?: string
      since?: string
      until?: string
      perPage?: number
    } = {},
    owner?: string,
    repo?: string
  ): Promise<
    Array<{
      sha: string
      message: string
      author: string
      date: string
      url: string
    }>
  > {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const { data } = await this.octokit.repos.listCommits({
      owner: repoOwner,
      repo: repoName,
      sha: options.sha,
      path: options.path,
      author: options.author,
      since: options.since,
      until: options.until,
      per_page: options.perPage || 30,
    })

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || '',
      url: commit.html_url,
    }))
  }

  /**
   * Create a comment on an issue or PR
   */
  async createComment(
    issueNumber: number,
    body: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    await this.octokit.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
      body,
    })
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(): Promise<{
    login: string
    name: string
    email: string
  }> {
    const { data } = await this.octokit.users.getAuthenticated()

    return {
      login: data.login,
      name: data.name || '',
      email: data.email || '',
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch?: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    // Get file SHA if it exists
    let sha: string | undefined
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path,
        ref: branch,
      })

      if (!Array.isArray(data) && data.type === 'file') {
        sha = data.sha
      }
    } catch (error) {
      // File doesn't exist, that's okay
    }

    await this.octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    })
  }

  /**
   * Get repository tree
   */
  async getTree(
    treeSha?: string,
    recursive: boolean = false,
    owner?: string,
    repo?: string
  ): Promise<
    Array<{
      path: string
      mode: string
      type: string
      sha: string
      size?: number
    }>
  > {
    const repoOwner = owner || this.owner
    const repoName = repo || this.repo

    if (!repoOwner || !repoName) {
      throw new Error('Repository owner and name must be provided')
    }

    const sha = treeSha || (await this.getRepoInfo(repoOwner, repoName)).defaultBranch

    const { data } = await this.octokit.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: sha,
      recursive: recursive ? '1' : undefined,
    })

    return (
      data.tree?.map(item => ({
        path: item.path || '',
        mode: item.mode || '',
        type: item.type || '',
        sha: item.sha || '',
        size: item.size,
      })) || []
    )
  }
}

/**
 * Create GitHub tool instance
 */
export function createGitHubTool(config: GitHubConfig): GitHubMcpTool {
  return new GitHubMcpTool(config)
}
