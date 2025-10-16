/**
 * Agent State Manager
 * 
 * Manages persistent session state for agents using Redis
 * Enables agents to remember what they've done and avoid duplicate operations
 */

import Redis from 'ioredis';
import {
  AgentSessionState,
  defaultAgentSessionState,
  ForkedRepoInfo,
} from '../types/agentState';

const AGENT_STATE_TTL = 7200; // 2 hours

export class AgentStateManager {
  private redisClient: Redis;
  private initialized = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
    });
    
    this.redisClient.on('error', (err) => {
      console.warn('[AgentStateManager] Redis connection issue:', err.message);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.redisClient.connect();
      this.initialized = true;
      console.log('[AgentStateManager] Connected to Redis');
    } catch (error: any) {
      console.warn('[AgentStateManager] Failed to connect to Redis:', error.message);
      this.initialized = false;
    }
  }

  private getStateKey(sessionId: string): string {
    return `agent:state:${sessionId}`;
  }

  /**
   * Create or get agent session state
   */
  async getOrCreateState(
    sessionId: string,
    jobId: string,
    userId: string,
    taskDescription: string
  ): Promise<AgentSessionState> {
    if (!this.initialized) await this.initialize();

    try {
      const key = this.getStateKey(sessionId);
      const existing = await this.redisClient.get(key);

      if (existing) {
        console.log(`[AgentStateManager] Loaded state for session ${sessionId}`);
        return JSON.parse(existing as string);
      }

      const newState = defaultAgentSessionState(sessionId, jobId, userId, taskDescription);
      await this.redisClient.setex(
        key,
        AGENT_STATE_TTL,
        JSON.stringify(newState)
      );
      console.log(`[AgentStateManager] Created new state for session ${sessionId}`);
      return newState;
    } catch (error: any) {
      console.warn('[AgentStateManager] Error managing state:', error.message);
      // Return in-memory state if Redis fails
      return defaultAgentSessionState(sessionId, jobId, userId, taskDescription);
    }
  }

  /**
   * Save state to Redis
   */
  async saveState(state: AgentSessionState): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      const key = this.getStateKey(state.sessionId);
      state.lastActivityAt = Date.now();
      await this.redisClient.setex(
        key,
        AGENT_STATE_TTL,
        JSON.stringify(state)
      );
      console.log(`[AgentStateManager] Saved state for session ${state.sessionId}`);
    } catch (error: any) {
      console.warn('[AgentStateManager] Error saving state:', error.message);
    }
  }

  /**
   * Record a tool call
   */
  recordToolCall(
    state: AgentSessionState,
    tool: string,
    args: Record<string, any>,
    result: Record<string, any>,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    state.totalToolCalls++;
    state.toolCallHistory.push({
      tool,
      args,
      result,
      timestamp: Date.now(),
      duration,
      success,
      error,
    });

    console.log(
      `[AgentState] Tool call recorded: ${tool} (${duration}ms, success: ${success})`
    );
  }

  /**
   * Record a forked repository
   */
  recordForkedRepo(
    state: AgentSessionState,
    owner: string,
    repo: string,
    forkOwner: string,
    forkRepo: string
  ): void {
    const forkedRepo: ForkedRepoInfo = {
      owner,
      repo,
      forkOwner,
      forkRepo,
      timestamp: Date.now(),
    };
    state.forkedRepos.push(forkedRepo);
    console.log(
      `[AgentState] Fork recorded: ${owner}/${repo} → ${forkOwner}/${forkRepo}`
    );
  }

  /**
   * Record a created branch
   */
  recordBranch(
    state: AgentSessionState,
    name: string,
    baseBranch: string,
    repo: string,
    forkOwner: string
  ): void {
    state.currentBranch = {
      name,
      baseBranch,
      repo,
      forkOwner,
      createdAt: Date.now(),
    };
    console.log(`[AgentState] Branch recorded: ${forkOwner}/${repo}/${name}`);
  }

  /**
   * Record file modifications
   */
  recordFileModification(
    state: AgentSessionState,
    path: string,
    newContent: string,
    oldContent?: string,
    action: 'created' | 'updated' | 'deleted' = 'updated'
  ): void {
    const existing = state.modifiedFiles.find((f) => f.path === path);
    if (existing) {
      existing.newContent = newContent;
      existing.timestamp = Date.now();
      console.log(`[AgentState] File update recorded: ${path}`);
    } else {
      state.modifiedFiles.push({
        path,
        oldContent,
        newContent,
        action,
        timestamp: Date.now(),
      });
      console.log(`[AgentState] File ${action} recorded: ${path}`);
    }
  }

  /**
   * Record search results
   */
  recordSearch(
    state: AgentSessionState,
    pattern: string,
    filePattern: string | undefined,
    totalMatches: number,
    files: string[]
  ): void {
    state.searchHistory.push({
      pattern,
      filePattern,
      totalMatches,
      files,
      timestamp: Date.now(),
    });
    console.log(
      `[AgentState] Search recorded: "${pattern}" → ${totalMatches} matches in ${files.length} files`
    );
  }

  /**
   * Record PR creation
   */
  recordPR(
    state: AgentSessionState,
    number: number,
    url: string,
    title: string,
    repo: string,
    owner: string,
    branch: string
  ): void {
    state.pullRequests.push({
      number,
      url,
      title,
      repo,
      owner,
      branch,
      createdAt: Date.now(),
    });
    console.log(`[AgentState] PR recorded: ${owner}/${repo}#${number}`);
  }

  /**
   * Check if operation already done (prevent duplicates)
   */
  isOperationDone(state: AgentSessionState, operationType: string, key: string): boolean {
    switch (operationType) {
      case 'fork': {
        const fork = state.forkedRepos.find(
          (f) => `${f.owner}/${f.repo}` === key
        );
        return !!fork;
      }
      case 'branch': {
        const branch = state.currentBranch;
        return branch ? branch.name === key : false;
      }
      case 'file_modified': {
        return state.modifiedFiles.some((f) => f.path === key);
      }
      case 'pr': {
        return state.pullRequests.some((pr) => pr.url === key);
      }
      case 'search': {
        return state.searchHistory.some((s) => s.pattern === key);
      }
      default:
        return false;
    }
  }

  /**
   * Get summary of what was done
   */
  getSummary(state: AgentSessionState): string {
    const lines: string[] = [];

    lines.push('📋 **Agent Operation Summary**');
    lines.push('');

    if (state.forkedRepos.length > 0) {
      lines.push('✅ **Forks:**');
      state.forkedRepos.forEach((fork) => {
        lines.push(`  - ${fork.owner}/${fork.repo} → ${fork.forkOwner}/${fork.forkRepo}`);
      });
      lines.push('');
    }

    if (state.currentBranch) {
      lines.push('✅ **Branch Created:**');
      lines.push(
        `  - ${state.currentBranch.forkOwner}/${state.currentBranch.repo}/${state.currentBranch.name}`
      );
      lines.push('');
    }

    if (state.modifiedFiles.length > 0) {
      lines.push('✅ **Files Modified:**');
      state.modifiedFiles.forEach((file) => {
        lines.push(`  - ${file.action}: ${file.path}`);
      });
      lines.push('');
    }

    if (state.searchHistory.length > 0) {
      lines.push('✅ **Searches Performed:**');
      state.searchHistory.forEach((search) => {
        lines.push(
          `  - Pattern: "${search.pattern}" → ${search.totalMatches} matches`
        );
      });
      lines.push('');
    }

    if (state.pullRequests.length > 0) {
      lines.push('✅ **Pull Requests:**');
      state.pullRequests.forEach((pr) => {
        lines.push(`  - [#${pr.number}](${pr.url}): ${pr.title}`);
      });
      lines.push('');
    }

    lines.push('📊 **Metrics:**');
    lines.push(`  - Tool calls: ${state.totalToolCalls}`);
    lines.push(`  - Files modified: ${state.modifiedFiles.length}`);
    lines.push(`  - Time elapsed: ${Math.round((Date.now() - state.startTime) / 1000)}s`);

    return lines.join('\n');
  }

  /**
   * Mark phase as completed
   */
  completePhase(state: AgentSessionState, phase: string): void {
    if (!state.completedPhases.includes(phase)) {
      state.completedPhases.push(phase);
      console.log(`[AgentState] Phase completed: ${phase}`);
    }
  }

  /**
   * Clear state (end of session)
   */
  async clearState(sessionId: string): Promise<void> {
    if (!this.initialized) await this.initialize();

    try {
      const key = this.getStateKey(sessionId);
      await this.redisClient.del(key);
      console.log(`[AgentStateManager] Cleared state for session ${sessionId}`);
    } catch (error: any) {
      console.warn('[AgentStateManager] Error clearing state:', error.message);
    }
  }
}

// Singleton instance
let stateManagerInstance: AgentStateManager | null = null;

export function getAgentStateManager(): AgentStateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new AgentStateManager();
  }
  return stateManagerInstance;
}
