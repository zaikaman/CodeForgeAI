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
     * Get GitHub issue details (title, body, comments, etc.)
     */
    createTool({
      name: 'bot_github_get_issue_cached',
      description: `Get GitHub issue details by issue number. Returns title, body, comments, and metadata.
        This is essential for understanding what needs to be fixed.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue number (e.g., 1 for #1)'),
      }),
      fn: async (args) => {
        try {
          if (!_octokit) {
            return {
              success: false,
              error: 'Octokit not configured',
              message: '❌ Cannot fetch issue: GitHub API not configured',
            };
          }

          // Get issue details
          const issue = await _octokit.rest.issues.get({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
          });

          // Get issue comments
          const comments = await _octokit.rest.issues.listComments({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
            per_page: 100,
          });

          const issueData = {
            number: issue.data.number,
            title: issue.data.title,
            body: issue.data.body || '',
            state: issue.data.state,
            labels: issue.data.labels?.map((l: any) => l.name) || [],
            assignees: issue.data.assignees?.map((a: any) => a.login) || [],
            author: issue.data.user?.login || 'unknown',
            createdAt: issue.data.created_at,
            updatedAt: issue.data.updated_at,
            comments: comments.data.map((c: any) => ({
              author: c.user?.login || 'unknown',
              body: c.body,
              createdAt: c.created_at,
            })),
          };

          return {
            success: true,
            issue: issueData,
            message: `✅ Retrieved issue #${args.issueNumber}: ${issue.data.title}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get issue #${args.issueNumber}: ${error.message}`,
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

    /**
     * Get repository info
     */
    createTool({
      name: 'bot_github_repo_info',
      description: `Get detailed information about a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.get({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            info: {
              name: data.name,
              fullName: data.full_name,
              description: data.description || '',
              language: data.language || 'Unknown',
              stars: data.stargazers_count,
              forks: data.forks_count,
              openIssues: data.open_issues_count,
              defaultBranch: data.default_branch,
              url: data.html_url,
              private: data.private,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            },
            message: `✅ Retrieved repository info for ${args.owner}/${args.repo}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get repo info: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List pull requests
     */
    createTool({
      name: 'bot_github_list_pull_requests',
      description: `List pull requests in a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('PR state filter (default: open)'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.pulls.list({
            owner: args.owner,
            repo: args.repo,
            state: args.state || 'open',
          });

          return {
            success: true,
            pullRequests: data.map((pr: any) => ({
              number: pr.number,
              title: pr.title,
              body: pr.body || '',
              state: pr.state,
              url: pr.html_url,
              createdAt: pr.created_at,
              updatedAt: pr.updated_at,
              author: pr.user?.login,
            })),
            count: data.length,
            message: `✅ Found ${data.length} pull requests`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list pull requests: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create issue
     */
    createTool({
      name: 'bot_github_create_issue',
      description: `Create a new issue in a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        title: z.string().describe('Issue title'),
        body: z.string().describe('Issue description'),
        labels: z.array(z.string()).optional().describe('Issue labels'),
        assignees: z.array(z.string()).optional().describe('GitHub usernames to assign'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.issues.create({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            body: args.body,
            labels: args.labels,
            assignees: args.assignees,
          });

          return {
            success: true,
            issue: {
              number: data.number,
              title: data.title,
              body: data.body,
              state: data.state,
              url: data.html_url,
              createdAt: data.created_at,
            },
            message: `✅ Issue #${data.number} created`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create issue: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List issues
     */
    createTool({
      name: 'bot_github_list_issues',
      description: `List issues in a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('Issue state filter (default: open)'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.issues.listForRepo({
            owner: args.owner,
            repo: args.repo,
            state: args.state || 'open',
          });

          return {
            success: true,
            issues: data.map((issue: any) => ({
              number: issue.number,
              title: issue.title,
              body: issue.body || '',
              state: issue.state,
              labels: issue.labels?.map((l: any) => typeof l === 'string' ? l : l.name) || [],
              url: issue.html_url,
              createdAt: issue.created_at,
              author: issue.user?.login,
            })),
            count: data.length,
            message: `✅ Found ${data.length} issues`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list issues: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List commits
     */
    createTool({
      name: 'bot_github_list_commits',
      description: `List commits in a repository or file path.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        path: z.string().optional().describe('File path (optional)'),
        author: z.string().optional().describe('Filter by author'),
        perPage: z.number().optional().describe('Commits per page (default: 30)'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.listCommits({
            owner: args.owner,
            repo: args.repo,
            path: args.path,
            author: args.author,
            per_page: args.perPage || 30,
          });

          return {
            success: true,
            commits: data.map((commit: any) => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author?.name || 'Unknown',
              date: commit.commit.author?.date,
              url: commit.html_url,
              author_login: commit.author?.login,
            })),
            count: data.length,
            message: `✅ Found ${data.length} commits`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list commits: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create comment on issue or PR
     */
    createTool({
      name: 'bot_github_create_comment',
      description: `Create a comment on an issue or pull request.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue or PR number'),
        body: z.string().describe('Comment body (markdown supported)'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.issues.createComment({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
            body: args.body,
          });

          return {
            success: true,
            comment: {
              id: data.id,
              body: data.body,
              author: data.user?.login,
              url: data.html_url,
              createdAt: data.created_at,
            },
            message: `✅ Comment created on issue #${args.issueNumber}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create comment: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get authenticated user
     */
    createTool({
      name: 'bot_github_get_authenticated_user',
      description: `Get current authenticated GitHub user information.`,
      schema: z.object({}),
      fn: async () => {
        try {
          const { data } = await _octokit.rest.users.getAuthenticated();

          return {
            success: true,
            user: {
              login: data.login,
              name: data.name || '',
              email: data.email || '',
              url: data.html_url,
              company: data.company || '',
              location: data.location || '',
              bio: data.bio || '',
              publicRepos: data.public_repos,
              followers: data.followers,
            },
            message: `✅ Retrieved user info for ${data.login}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get authenticated user: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create or update file
     */
    createTool({
      name: 'bot_github_create_or_update_file',
      description: `Create or update a file in a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        path: z.string().describe('File path'),
        content: z.string().describe('File content'),
        message: z.string().describe('Commit message'),
        branch: z.string().optional().describe('Target branch (default: main)'),
      }),
      fn: async (args) => {
        try {
          // Get existing file SHA if it exists
          let sha: string | undefined;
          try {
            const { data: existing } = await _octokit.rest.repos.getContent({
              owner: args.owner,
              repo: args.repo,
              path: args.path,
              ref: args.branch,
            });
            if (!Array.isArray(existing) && existing.type === 'file') {
              sha = existing.sha;
            }
          } catch {
            // File doesn't exist, that's okay
          }

          const { data } = await _octokit.rest.repos.createOrUpdateFileContents({
            owner: args.owner,
            repo: args.repo,
            path: args.path,
            message: args.message,
            content: Buffer.from(args.content).toString('base64'),
            sha,
            branch: args.branch,
          });

          return {
            success: true,
            file: {
              path: args.path,
              sha: data.content?.sha,
              message: args.message,
            },
            message: `✅ File ${args.path} created/updated`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create/update file: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List branches
     */
    createTool({
      name: 'bot_github_list_branches',
      description: `List all branches in a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.listBranches({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            branches: data.map((branch: any) => ({
              name: branch.name,
              protected: branch.protected,
              sha: branch.commit.sha,
            })),
            count: data.length,
            message: `✅ Found ${data.length} branches`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list branches: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Delete branch
     */
    createTool({
      name: 'bot_github_delete_branch',
      description: `Delete a branch from a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().describe('Branch name to delete'),
      }),
      fn: async (args) => {
        try {
          await _octokit.rest.git.deleteRef({
            owner: args.owner,
            repo: args.repo,
            ref: `heads/${args.branch}`,
          });

          return {
            success: true,
            branch: args.branch,
            message: `✅ Branch ${args.branch} deleted`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to delete branch: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Merge pull request
     */
    createTool({
      name: 'bot_github_merge_pr',
      description: `Merge a pull request.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        prNumber: z.number().describe('Pull request number'),
        mergeMethod: z.enum(['merge', 'squash', 'rebase']).optional().describe('Merge method (default: merge)'),
        message: z.string().optional().describe('Commit message'),
      }),
      fn: async (args) => {
        try {
          await _octokit.rest.pulls.merge({
            owner: args.owner,
            repo: args.repo,
            pull_number: args.prNumber,
            merge_method: args.mergeMethod || 'merge',
            commit_message: args.message,
          });

          return {
            success: true,
            prNumber: args.prNumber,
            message: `✅ PR #${args.prNumber} merged`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to merge PR: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Review pull request
     */
    createTool({
      name: 'bot_github_review_pr',
      description: `Add a review to a pull request.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        prNumber: z.number().describe('Pull request number'),
        event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']).describe('Review event type'),
        body: z.string().optional().describe('Review comment'),
      }),
      fn: async (args) => {
        try {
          await _octokit.rest.pulls.createReview({
            owner: args.owner,
            repo: args.repo,
            pull_number: args.prNumber,
            event: args.event,
            body: args.body,
          });

          return {
            success: true,
            prNumber: args.prNumber,
            event: args.event,
            message: `✅ Review added to PR #${args.prNumber}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to add review: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get pull request files
     */
    createTool({
      name: 'bot_github_get_pr_files',
      description: `Get files changed in a pull request.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        prNumber: z.number().describe('Pull request number'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.pulls.listFiles({
            owner: args.owner,
            repo: args.repo,
            pull_number: args.prNumber,
          });

          return {
            success: true,
            files: data.map((file: any) => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch,
            })),
            count: data.length,
            message: `✅ Found ${data.length} files in PR #${args.prNumber}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get PR files: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Search code
     */
    createTool({
      name: 'bot_github_search_code',
      description: `Search code across GitHub repositories.`,
      schema: z.object({
        query: z.string().describe('Search query'),
        owner: z.string().optional().describe('Repository owner (optional, to limit to specific repo)'),
        repo: z.string().optional().describe('Repository name (optional, to limit to specific repo)'),
      }),
      fn: async (args) => {
        try {
          let searchQuery = args.query;
          if (args.owner && args.repo) {
            searchQuery = `${args.query} repo:${args.owner}/${args.repo}`;
          }

          const { data } = await _octokit.rest.search.code({
            q: searchQuery,
            per_page: 50,
          });

          return {
            success: true,
            results: (data.items || []).map((item: any) => ({
              name: item.name,
              path: item.path,
              repository: item.repository?.full_name,
              url: item.html_url,
            })),
            totalCount: data.total_count,
            message: `✅ Found ${data.total_count} code matches`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to search code: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Search issues
     */
    createTool({
      name: 'bot_github_search_issues',
      description: `Search for issues and pull requests.`,
      schema: z.object({
        query: z.string().describe('Search query'),
        owner: z.string().optional().describe('Repository owner (optional)'),
        repo: z.string().optional().describe('Repository name (optional)'),
      }),
      fn: async (args) => {
        try {
          let searchQuery = args.query;
          if (args.owner && args.repo) {
            searchQuery = `${args.query} repo:${args.owner}/${args.repo}`;
          }

          const { data } = await _octokit.rest.search.issuesAndPullRequests({
            q: searchQuery,
            per_page: 50,
          });

          return {
            success: true,
            results: (data.items || []).map((item: any) => ({
              number: item.number,
              title: item.title,
              state: item.state,
              url: item.html_url,
              type: item.pull_request ? 'PR' : 'Issue',
              author: item.user?.login,
            })),
            totalCount: data.total_count,
            message: `✅ Found ${data.total_count} results`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to search issues: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List workflow runs
     */
    createTool({
      name: 'bot_github_list_workflow_runs',
      description: `List GitHub Actions workflow runs for a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.actions.listWorkflowRunsForRepo({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            workflows: (data.workflow_runs || []).map((run: any) => ({
              id: run.id,
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              url: run.html_url,
              createdAt: run.created_at,
            })),
            count: (data.workflow_runs || []).length,
            message: `✅ Found ${(data.workflow_runs || []).length} workflow runs`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list workflow runs: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Trigger workflow dispatch
     */
    createTool({
      name: 'bot_github_trigger_workflow',
      description: `Trigger a GitHub Actions workflow.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        workflowId: z.union([z.string(), z.number()]).describe('Workflow ID or filename'),
        ref: z.string().describe('Git ref (branch, tag, or commit SHA)'),
        inputs: z.record(z.string(), z.any()).optional().describe('Workflow input parameters'),
      }),
      fn: async (args) => {
        try {
          await _octokit.rest.actions.createWorkflowDispatch({
            owner: args.owner,
            repo: args.repo,
            workflow_id: args.workflowId,
            ref: args.ref,
            inputs: args.inputs,
          });

          return {
            success: true,
            workflowId: args.workflowId,
            message: `✅ Workflow triggered`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to trigger workflow: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Update issue
     */
    createTool({
      name: 'bot_github_update_issue',
      description: `Update an issue (title, body, state, labels, assignees).`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue number'),
        title: z.string().optional().describe('New issue title'),
        body: z.string().optional().describe('New issue body'),
        state: z.enum(['open', 'closed']).optional().describe('New issue state'),
        labels: z.array(z.string()).optional().describe('New labels'),
        assignees: z.array(z.string()).optional().describe('New assignees'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.issues.update({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
            title: args.title,
            body: args.body,
            state: args.state,
            labels: args.labels,
            assignees: args.assignees,
          });

          return {
            success: true,
            issue: {
              number: data.number,
              title: data.title,
              state: data.state,
              url: data.html_url,
            },
            message: `✅ Issue #${args.issueNumber} updated`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to update issue: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get pull request details
     */
    createTool({
      name: 'bot_github_get_pr',
      description: `Get detailed information about a pull request.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        prNumber: z.number().describe('Pull request number'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.pulls.get({
            owner: args.owner,
            repo: args.repo,
            pull_number: args.prNumber,
          });

          return {
            success: true,
            pr: {
              number: data.number,
              title: data.title,
              body: data.body,
              state: data.state,
              url: data.html_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              mergeable: data.mergeable,
              merged: data.merged,
              author: data.user?.login,
              head: data.head?.ref,
              base: data.base?.ref,
            },
            message: `✅ Retrieved PR #${args.prNumber}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get PR: ${error.message}`,
          };
        }
      },
    }),

    /**
     * List collaborators
     */
    createTool({
      name: 'bot_github_list_collaborators',
      description: `List collaborators on a repository.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.listCollaborators({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            collaborators: data.map((collab: any) => ({
              login: collab.login,
              name: collab.name || '',
              role: (collab as any).role_name || 'unknown',
              permissions: {
                admin: collab.permissions?.admin || false,
                maintain: (collab.permissions as any)?.maintain || false,
                push: collab.permissions?.push || false,
                triage: (collab.permissions as any)?.triage || false,
                pull: collab.permissions?.pull || false,
              },
            })),
            count: data.length,
            message: `✅ Found ${data.length} collaborators`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to list collaborators: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Get commit diff
     */
    createTool({
      name: 'bot_github_get_commit_diff',
      description: `Get the diff for a specific commit.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        commitSha: z.string().describe('Commit SHA'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.getCommit({
            owner: args.owner,
            repo: args.repo,
            ref: args.commitSha,
          });

          return {
            success: true,
            commit: {
              sha: data.sha,
              message: data.commit.message,
              author: data.commit.author?.name,
              date: data.commit.author?.date,
              url: data.html_url,
            },
            files: (data.files || []).map((file: any) => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch,
            })),
            fileCount: (data.files || []).length,
            message: `✅ Retrieved commit diff for ${args.commitSha}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get commit diff: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Create repository
     */
    createTool({
      name: 'bot_github_create_repository',
      description: `Create a new repository in the authenticated user's account.`,
      schema: z.object({
        name: z.string().describe('Repository name'),
        description: z.string().optional().describe('Repository description'),
        private: z.boolean().optional().describe('Make repository private (default: false)'),
        autoInit: z.boolean().optional().describe('Auto-initialize with README (default: true)'),
        gitignoreTemplate: z.string().optional().describe('Gitignore template'),
        licenseTemplate: z.string().optional().describe('License template'),
      }),
      fn: async (args) => {
        try {
          const { data } = await _octokit.rest.repos.createForAuthenticatedUser({
            name: args.name,
            description: args.description,
            private: args.private || false,
            auto_init: args.autoInit !== false,
            gitignore_template: args.gitignoreTemplate,
            license_template: args.licenseTemplate,
          });

          return {
            success: true,
            repo: {
              name: data.name,
              fullName: data.full_name,
              url: data.html_url,
              cloneUrl: data.clone_url,
              private: data.private,
              defaultBranch: data.default_branch,
            },
            message: `✅ Repository ${data.full_name} created`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to create repository: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Delete repository
     */
    createTool({
      name: 'bot_github_delete_repository',
      description: `Delete a repository (use with caution!).`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      fn: async (args) => {
        try {
          await _octokit.rest.repos.delete({
            owner: args.owner,
            repo: args.repo,
          });

          return {
            success: true,
            repo: `${args.owner}/${args.repo}`,
            message: `✅ Repository ${args.owner}/${args.repo} deleted`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to delete repository: ${error.message}`,
          };
        }
      },
    }),

    /**
     * Push multiple files (batch commit)
     */
    createTool({
      name: 'bot_github_push_files',
      description: `Commit and push multiple files to a repository in one operation.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        files: z.array(z.object({
          path: z.string().describe('File path'),
          content: z.string().describe('File content'),
        })).describe('Files to commit'),
        message: z.string().describe('Commit message'),
        branch: z.string().optional().describe('Target branch (default: main)'),
      }),
      fn: async (args) => {
        try {
          // Get repository info first to get default branch
          const repoInfo = await _octokit.rest.repos.get({
            owner: args.owner,
            repo: args.repo,
          });

          const targetBranch = args.branch || repoInfo.data.default_branch;

          // Get current branch ref
          const { data: refData } = await _octokit.rest.git.getRef({
            owner: args.owner,
            repo: args.repo,
            ref: `heads/${targetBranch}`,
          });

          const currentCommitSha = refData.object.sha;

          // Get current commit tree
          const { data: commitData } = await _octokit.rest.git.getCommit({
            owner: args.owner,
            repo: args.repo,
            commit_sha: currentCommitSha,
          });

          const baseTreeSha = commitData.tree.sha;

          // Create blobs for each file
          const blobs = await Promise.all(
            args.files.map(async (file) => {
              const { data: blob } = await _octokit.rest.git.createBlob({
                owner: args.owner,
                repo: args.repo,
                content: Buffer.from(file.content).toString('base64'),
                encoding: 'base64',
              });

              return {
                path: file.path,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: blob.sha,
              };
            })
          );

          // Create new tree
          const { data: newTree } = await _octokit.rest.git.createTree({
            owner: args.owner,
            repo: args.repo,
            base_tree: baseTreeSha,
            tree: blobs,
          });

          // Create new commit
          const { data: newCommit } = await _octokit.rest.git.createCommit({
            owner: args.owner,
            repo: args.repo,
            message: args.message,
            tree: newTree.sha,
            parents: [currentCommitSha],
          });

          // Update branch reference
          await _octokit.rest.git.updateRef({
            owner: args.owner,
            repo: args.repo,
            ref: `heads/${targetBranch}`,
            sha: newCommit.sha,
          });

          return {
            success: true,
            commitSha: newCommit.sha,
            filesCount: args.files.length,
            branch: targetBranch,
            message: `✅ Pushed ${args.files.length} files to ${targetBranch}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to push files: ${error.message}`,
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
