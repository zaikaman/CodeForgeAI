/**
 * Git Tools with Local Cache
 * 
 * Wraps GitHub tools with local filesystem cache for dramatic performance improvements
 * Agent uses cached files instead of API calls when available
 */

import { createTool } from '@iqai/adk';
import { z } from 'zod';
import { RepositoryFileSystemCache } from './repositoryFileSystemCache';
import { Octokit } from '@octokit/rest';

/**
 * Create cached GitHub tools for agent
 */
export function createCachedGitHubTools(_octokit: Octokit) {
  const cache = new RepositoryFileSystemCache({
    maxCacheSize: 2 * 1024 * 1024 * 1024, // 2GB
    cacheTTL: 2 * 60 * 60 * 1000, // 2 hours
    maxRepositories: 20,
    octokit: _octokit, // Pass Octokit for API fallback
  });

  const tools = [
    /**
     * Get file content - uses local cache first
     */
    createTool({
      name: 'bot_github_get_file_cached',
      description: `Get file content from local cache (much faster than API). 
        Automatically clones repository on first access and caches all subsequent reads.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        path: z.string().describe('File path'),
        branch: z.string().optional().describe('Branch name (default: main)'),
      }),
      fn: async (args) => {
        try {
          const content = await cache.getFileContent(
            args.owner,
            args.repo,
            args.path,
            args.branch || 'main'
          );

          return {
            success: true,
            content,
            size: Buffer.byteLength(content),
            message: `✅ Retrieved ${args.path} from cache`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get file: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Search files using local filesystem search - extremely fast
     */
    createTool({
      name: 'bot_github_search_cached',
      description: `Search repository files using local filesystem search (local + fast). 
        Supports regex patterns and file filtering. Much faster than API search.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        pattern: z.string().describe('Search pattern (regex supported)'),
        branch: z.string().optional().describe('Branch name (default: main)'),
        filePattern: z
          .string()
          .optional()
          .describe('File pattern to limit search (e.g., "*.ts", "src/**")'),
      }),
      fn: async (args) => {
        try {
          const results = await cache.searchFiles(
            args.owner,
            args.repo,
            args.pattern,
            args.branch || 'main',
            args.filePattern
          );

          return {
            success: true,
            results: results.slice(0, 50), // Limit to first 50 for display
            totalMatches: results.length,
            message: `✅ Found ${results.length} matches using local search`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Search failed: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get file tree - local filesystem
     */
    createTool({
      name: 'bot_github_tree_cached',
      description: `Get directory tree structure from local cache.
        Returns file and folder listing for navigation and analysis.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().optional().describe('Branch name (default: main)'),
        dir: z
          .string()
          .optional()
          .describe('Directory path (empty for root)'),
      }),
      fn: async (args) => {
        try {
          const tree = await cache.getFileTree(
            args.owner,
            args.repo,
            args.branch || 'main',
            args.dir
          );

          return {
            success: true,
            tree: tree.slice(0, 100), // Limit to 100 entries
            totalEntries: tree.length,
            message: `✅ Retrieved tree for ${args.dir || 'root'} with ${tree.length} entries`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Tree retrieval failed: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Edit file in cache
     */
    createTool({
      name: 'bot_github_edit_cached',
      description: `Edit file in local cache before committing.
        Changes are made locally; use push tool to commit and push to GitHub.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        path: z.string().describe('File path'),
        oldContent: z.string().describe('Content to find and replace'),
        newContent: z.string().describe('New content'),
        branch: z.string().optional().describe('Branch name (default: main)'),
      }),
      fn: async (args) => {
        try {
          const updated = await cache.editFile(
            args.owner,
            args.repo,
            args.path,
            args.oldContent,
            args.newContent,
            args.branch || 'main'
          );

          return {
            success: true,
            content: updated,
            message: `✅ File updated in cache: ${args.path}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Edit failed: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get modified files
     */
    createTool({
      name: 'bot_github_modified_cached',
      description: `Get list of files modified in working directory.
        Shows files that have been edited but not yet committed.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().optional().describe('Branch name (default: main)'),
      }),
      fn: async (args) => {
        try {
          const modified = await cache.getModifiedFiles(
            args.owner,
            args.repo,
            args.branch || 'main'
          );

          return {
            success: true,
            files: modified,
            totalModified: modified.length,
            message: `✅ Found ${modified.length} modified files`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get modified files: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get cache stats
     */
    createTool({
      name: 'bot_github_cache_stats',
      description: `Get statistics about local cache usage.
        Shows memory usage, cached repositories, and cache health.`,
      schema: z.object({}),
      fn: async () => {
        try {
          const stats = cache.getStats();
          return {
            success: true,
            stats,
            message: `✅ Cache stats retrieved`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    /**
     * Clear specific repository cache
     */
    createTool({
      name: 'bot_github_clear_repo_cache',
      description: `Clear cache for specific repository to force refresh.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          await cache.clearRepository(args.owner, args.repo);
          return {
            success: true,
            message: `✅ Cache cleared for ${args.owner}/${args.repo}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    /**
     * Clear all cache
     */
    createTool({
      name: 'bot_github_clear_all_cache',
      description: `Clear all local caches.`,
      schema: z.object({}),
      fn: async () => {
        try {
          await cache.clearAll();
          return {
            success: true,
            message: `✅ All caches cleared`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    /**
     * Preload repository - prepare cache before analysis
     * This should be called first with the target repository
     */
    createTool({
      name: 'bot_github_preload_repo',
      description: `Preload a repository into cache. Call this first with the target repository URL or owner/repo.
        This prepares the cache and makes subsequent file reads instant.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().optional().describe('Branch name (default: main)'),
      }),
      fn: async (args) => {
        try {
          console.log(`[CachedGitHubTools] Preloading ${args.owner}/${args.repo}...`);
          const info = await cache.ensureRepository(
            args.owner,
            args.repo,
            args.branch || 'main'
          );

          return {
            success: true,
            owner: args.owner,
            repo: args.repo,
            branch: args.branch || 'main',
            fileCount: info.fileCount,
            totalSize: info.totalSize,
            message: `✅ Repository ${args.owner}/${args.repo} preloaded and ready for analysis`,
          };
        } catch (error: any) {
          return {
            success: false,
            owner: args.owner,
            repo: args.repo,
            error: error.message,
            message: `❌ Failed to preload: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Fork repository to bot account
     */
    createTool({
      name: 'bot_github_fork_repo',
      description: `Fork a repository to codeforge-ai-bot account. Use this when modifying someone else's repo.
        Returns: fork URL and owner info.`,
      schema: z.object({
        owner: z.string().describe('Original repository owner'),
        repo: z.string().describe('Original repository name'),
      }),
      fn: async (args) => {
        try {
          const fork = await _octokit.rest.repos.createFork({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            forkURL: fork.data.html_url,
            forkOwner: fork.data.owner.login,
            forkRepo: fork.data.name,
            message: `✅ Repository forked to ${fork.data.owner.login}/${fork.data.name}`,
          };
        } catch (error: any) {
          // Fork might already exist
          if (error.status === 422) {
            return {
              success: true,
              forkExists: true,
              forkOwner: 'codeforge-ai-bot',
              forkRepo: args.repo,
              message: `✅ Fork already exists: codeforge-ai-bot/${args.repo}`,
            };
          }
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to fork: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create branch in forked repository
     */
    createTool({
      name: 'bot_github_create_branch',
      description: `Create a new branch in forked repository (in codeforge-ai-bot account).`,
      schema: z.object({
        repo: z.string().describe('Repository name'),
        branchName: z.string().describe('New branch name (e.g., "fix-issue-123")'),
        baseBranch: z
          .string()
          .optional()
          .describe('Base branch to branch from (default: main)'),
      }),
      fn: async (args) => {
        try {
          // Get the current main branch SHA
          const mainRef = await _octokit.rest.git.getRef({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            ref: `heads/${args.baseBranch || 'main'}`,
          });

          // Create new branch
          await _octokit.rest.git.createRef({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            ref: `refs/heads/${args.branchName}`,
            sha: mainRef.data.object.sha,
          });

          return {
            success: true,
            branch: args.branchName,
            message: `✅ Branch created: codeforge-ai-bot/${args.repo}/${args.branchName}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create branch: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Commit and push files to forked repository
     */
    createTool({
      name: 'bot_github_commit_files',
      description: `Commit modified files and push to a branch in forked repository (codeforge-ai-bot).
        Use this after making local edits to push them to GitHub.`,
      schema: z.object({
        repo: z.string().describe('Repository name'),
        branch: z.string().describe('Branch to push to'),
        files: z
          .array(
            z.object({
              path: z.string().describe('File path'),
              content: z.string().describe('New file content'),
            })
          )
          .describe('Files to commit'),
        message: z.string().describe('Commit message'),
      }),
      fn: async (args) => {
        try {
          // Get current branch tree
          const { data: branchRef } = await _octokit.rest.git.getRef({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            ref: `heads/${args.branch}`,
          });

          const { data: commit } = await _octokit.rest.git.getCommit({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            commit_sha: branchRef.object.sha,
          });

          let treeEntries: any[] = [];
          for (const file of args.files) {
            // Create blob for each file
            const { data: blob } = await _octokit.rest.git.createBlob({
              owner: 'codeforge-ai-bot',
              repo: args.repo,
              content: file.content,
              encoding: 'utf-8',
            });

            treeEntries.push({
              path: file.path,
              mode: '100644',
              type: 'blob',
              sha: blob.sha,
            });
          }

          // Create tree
          const { data: tree } = await _octokit.rest.git.createTree({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            base_tree: commit.tree.sha,
            tree: treeEntries,
          });

          // Create commit
          const { data: newCommit } = await _octokit.rest.git.createCommit({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            message: args.message,
            tree: tree.sha,
            parents: [branchRef.object.sha],
          });

          // Update branch reference
          await _octokit.rest.git.updateRef({
            owner: 'codeforge-ai-bot',
            repo: args.repo,
            ref: `heads/${args.branch}`,
            sha: newCommit.sha,
          });

          return {
            success: true,
            filesCommitted: args.files.length,
            commit: newCommit.sha,
            message: `✅ Committed ${args.files.length} files to ${args.branch}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to commit files: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create pull request from fork to original repo
     */
    createTool({
      name: 'bot_github_create_pr',
      description: `Create a pull request from forked repository (codeforge-ai-bot) to original repository.
        Use this to submit your changes for review.`,
      schema: z.object({
        owner: z.string().describe('Original repository owner'),
        repo: z.string().describe('Original repository name'),
        branch: z.string().describe('Branch in forked repo to create PR from'),
        title: z.string().describe('PR title'),
        body: z.string().describe('PR description (markdown supported)'),
      }),
      fn: async (args) => {
        try {
          const pr = await _octokit.rest.pulls.create({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            body: args.body,
            head: `codeforge-ai-bot:${args.branch}`,
            base: 'main',
          });

          return {
            success: true,
            prNumber: pr.data.number,
            prURL: pr.data.html_url,
            message: `✅ PR created: ${pr.data.html_url}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create PR: ${error.message}`,
          };
        }
      },
    }),
  ];

  return { tools, cache };
}

/**
 * Export cache class for use in other tools
 */
export { RepositoryFileSystemCache };
