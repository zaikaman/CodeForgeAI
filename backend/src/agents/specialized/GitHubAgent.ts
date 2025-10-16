/**
 * GitHubAgent - Specialized agent for ALL GitHub operations
 * 
 * CAPABILITIES:
 * - Deep codebase analysis and understanding
 * - Systematic problem solving for complex issues
 * - Smart file discovery and context building
 * - Fetch files/code from repositories
 * - Create/update files via PRs (using bot token - no user token needed!)
 * - Manage branches, issues, PRs
 * - Orchestrate code generation/translation with other agents
 * - Complete end-to-end GitHub workflows
 * - SESSION MEMORY to prevent duplicate operations
 * 
 * This agent uses CodeForge AI Bot token for most operations, so users
 * don't need to provide their personal access tokens!
 * 
 * ENHANCED VERSION: Now includes:
 * - Advanced codebase analysis tools for complex issues
 * - Session state tracking to prevent duplicate operations
 * - Comprehensive search validation
 * - Pre-PR validation checklist
 * 
 * OPERATION MODES:
 * 1. Bot Mode (Default) - Uses bot token for PRs via fork, issues, comments
 * 2. User Mode (Optional) - Uses user token only when explicitly needed
 */

import { AgentBuilder } from '@iqai/adk';
import { z } from 'zod';
import { GITHUB_AGENT_ENHANCED_SYSTEM_PROMPT } from '../../prompts/github-agent-enhanced-prompt';
import { createCachedGitHubTools } from '../../utils/cachedGitHubTools';
import { AgentCacheManager } from '../../utils/agentCacheManager';
import { getAgentStateManager } from '../../services/AgentStateManager';
import { Octokit } from '@octokit/rest';

const githubAgentResponseSchema = z.object({
  summary: z.string().describe('Summary of what was accomplished'),
  analysis: z.object({
    understood: z.string().describe('What you understood from the issue/request'),
    approach: z.string().describe('Your planned approach to solve it'),
    filesIdentified: z.array(z.string()).optional().describe('Key files identified for this task'),
  }).optional().describe('Include this when you did analysis phase (for complex issues)'),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })).optional().nullable().describe('ONLY include this when fetching/reading files from repository for user to preview. DO NOT include when creating PRs or issues.'),
  filesModified: z.array(z.object({
    path: z.string(),
    action: z.enum(['created', 'updated', 'deleted']),
  })).optional().nullable().describe('List of files that were modified in the PR'),
  prCreated: z.object({
    number: z.number(),
    url: z.string(),
    title: z.string(),
  }).optional().nullable().describe('Details of the PR that was created'),
  branchCreated: z.string().optional().nullable().describe('Name of the branch that was created'),
  repoCreated: z.object({
    owner: z.string(),
    name: z.string(),
    url: z.string(),
  }).optional().nullable().describe('Details of the repository that was created'),
});

export const GitHubAgent = async (
  githubContext?: { token: string; username: string; email?: string },
  sessionId?: string,
  jobId?: string,
  userId?: string,
  taskDescription?: string
) => {
  console.log('[GitHubAgent] Initializing with LOCAL CACHE layer for 50-100x performance boost');
  
  try {
    // Initialize state manager for session tracking
    const stateManager = getAgentStateManager();
    await stateManager.initialize();
    
    // Get or create session state
    const state = sessionId && jobId && userId && taskDescription
      ? await stateManager.getOrCreateState(sessionId, jobId, userId, taskDescription)
      : null;
    
    if (state) {
      console.log(`[GitHubAgent] Session state loaded: ${state.sessionId}`);
      console.log(`[GitHubAgent] Previous operations: ${state.totalToolCalls} tool calls, ${state.modifiedFiles.length} files modified`);
    }
    
    // Initialize cache manager for faster operations
    const cacheManager = new AgentCacheManager();
    const cacheStats = cacheManager.getContextSummary();
    
    console.log('[GitHubAgent] Cache system ready:', cacheStats);
    
    // Try to use cached tools with bot token
    try {
      const botToken = process.env.CODEFORGE_BOT_GITHUB_TOKEN;
      if (!botToken) {
        throw new Error('No bot token available');
      }
      
      const octokit = new Octokit({ auth: botToken });
      const cachedTools = createCachedGitHubTools(octokit);
      
      console.log('[GitHubAgent] ✅ Initialized with CACHED tools (bot mode)');
      console.log('[GitHubAgent] Tool count:', cachedTools.tools.length);
      
      // Build comprehensive system prompt with state info
      const stateInfo = state 
        ? `\n\n**📋 SESSION STATE (Prevent duplicates!):**\n${stateManager.getSummary(state)}`
        : '';
      
      const systemPrompt = GITHUB_AGENT_ENHANCED_SYSTEM_PROMPT + '\n\n' + cacheStats + 
        stateInfo +
        '\n\n**Performance Note:** Repository caching makes all file operations instant. ' +
        'Use search to find code, then read only what you need, then edit and commit.';
      
      return AgentBuilder.create('GitHubAgent')
        .withModel('gpt-5-nano-2025-08-07')
        .withInstruction(systemPrompt)
        .withTools(...cachedTools.tools)
        .withOutputSchema(githubAgentResponseSchema)
        .build();
        
    } catch (botTokenError: any) {
      console.warn('[GitHubAgent] Bot token mode failed:', botTokenError.message);
      
      // Fallback to user token mode if bot token not available
      if (githubContext) {
        console.log('[GitHubAgent] ⚠️ Falling back to user token mode with cache layer');
        
        const octokit = new Octokit({ auth: githubContext.token });
        const cachedTools = createCachedGitHubTools(octokit);
        
        const stateInfo = state 
          ? `\n\n**📋 SESSION STATE (Prevent duplicates!):**\n${stateManager.getSummary(state)}`
          : '';
        
        const systemPrompt = GITHUB_AGENT_ENHANCED_SYSTEM_PROMPT + '\n\n' + cacheStats +
          stateInfo +
          '\n\n**Mode:** USER TOKEN (bot token not configured)';
        
        return AgentBuilder.create('GitHubAgent')
          .withModel('gpt-5-nano-2025-08-07')
          .withInstruction(systemPrompt)
          .withTools(...cachedTools.tools)
          .withOutputSchema(githubAgentResponseSchema)
          .build();
      }
      
      throw new Error('GitHub Agent requires either bot token (CODEFORGE_BOT_GITHUB_TOKEN) or user context');
    }
    
  } catch (error: any) {
    console.error('[GitHubAgent] Fatal initialization error:', error.message);
    throw error;
  }
};
