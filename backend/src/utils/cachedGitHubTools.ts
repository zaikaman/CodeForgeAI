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
     * Search files using git grep - extremely fast
     */
    createTool({
      name: 'bot_github_search_cached',
      description: `Search repository files using git grep (local + fast). 
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
            message: `✅ Found ${results.length} matches using git grep`,
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
  ];

  return { tools, cache };
}

/**
 * Export cache class for use in other tools
 */
export { RepositoryFileSystemCache };
