/**
 * Advanced GitHub Search Tools
 * Ported from gemini-cli with 3 search strategies
 * 
 * Strategies:
 * 1. GitHub Code Search API (cloud-based, fastest for repos on GitHub)
 * 2. Local git grep (if repo is cloned locally)
 * 3. Pure JavaScript fallback (glob + regex)
 */

import { Octokit } from '@octokit/rest';
import { spawn } from 'child_process';
import { EOL } from 'os';

/**
 * Parameters for GitHub search
 */
export interface GitHubSearchParams {
  owner: string;
  repo: string;
  pattern: string; // Regex pattern or plain text
  path?: string; // Optional: search within specific path
  include?: string; // Optional: file pattern (e.g., "*.ts", "*.{js,jsx}")
  branch?: string; // Optional: specific branch
  isRegex?: boolean; // Whether pattern is regex (default: true)
}

/**
 * Search result for a single match
 */
export interface SearchMatch {
  filePath: string;
  lineNumber: number;
  line: string;
  snippet?: string; // Optional: surrounding context
}

/**
 * Grouped search results
 */
export interface SearchResult {
  success: boolean;
  strategy: 'github-api' | 'git-grep' | 'javascript' | 'none';
  totalMatches: number;
  matchesByFile: Record<string, SearchMatch[]>;
  error?: string;
}

/**
 * Strategy 1: GitHub Code Search API
 * - Fast for repos on GitHub
 * - Limited by API rate limits (10 req/min for code search)
 * - Returns rich results with snippets
 */
async function searchWithGitHubAPI(
  octokit: Octokit,
  params: GitHubSearchParams
): Promise<SearchResult | null> {
  try {
    // Build search query
    let query = `${params.pattern} repo:${params.owner}/${params.repo}`;
    
    if (params.path) {
      query += ` path:${params.path}`;
    }
    
    if (params.include) {
      // Convert glob pattern to GitHub search format
      const extension = params.include.replace('*.', '').replace('{', '').replace('}', '');
      query += ` extension:${extension}`;
    }

    console.log('🔍 GitHub API search query:', query);

    const { data } = await octokit.search.code({
      q: query,
      per_page: 100, // Max allowed
    });

    if (data.total_count === 0) {
      return {
        success: true,
        strategy: 'github-api',
        totalMatches: 0,
        matchesByFile: {},
      };
    }

    // Parse results
    const matchesByFile: Record<string, SearchMatch[]> = {};
    let totalMatches = 0;

    for (const item of data.items) {
      const filePath = item.path;
      
      // GitHub search doesn't provide line numbers directly
      // We'll need to fetch file content to get exact line numbers
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: params.owner,
          repo: params.repo,
          path: item.path,
          ref: params.branch,
        });

        if (Array.isArray(fileData) || fileData.type !== 'file') {
          continue;
        }

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const lines = content.split('\n');
        
        const regex = params.isRegex !== false 
          ? new RegExp(params.pattern, 'i')
          : new RegExp(params.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const matches: SearchMatch[] = [];
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            matches.push({
              filePath,
              lineNumber: index + 1,
              line: line.trim(),
            });
            totalMatches++;
          }
        });

        if (matches.length > 0) {
          matchesByFile[filePath] = matches;
        }
      } catch (err) {
        console.warn(`Failed to fetch content for ${item.path}:`, err);
      }
    }

    console.log('✓ GitHub API search: found', totalMatches, 'matches');

    return {
      success: true,
      strategy: 'github-api',
      totalMatches,
      matchesByFile,
    };
  } catch (error: any) {
    console.log('GitHub API search failed:', error.message);
    return null; // Fallback to next strategy
  }
}

/**
 * Strategy 2: Local git grep (if repo is cloned)
 * - Very fast for local repos
 * - Requires git to be installed
 * - Limited to cloned repositories
 */
async function searchWithGitGrep(
  repoPath: string,
  params: GitHubSearchParams
): Promise<SearchResult | null> {
  try {
    const gitArgs = [
      'grep',
      '-n', // Show line numbers
      '-E', // Extended regex
      '--ignore-case',
      params.pattern,
    ];

    if (params.include) {
      gitArgs.push('--', params.include);
    }

    console.log('🔍 Git grep command:', 'git', gitArgs.join(' '));

    const output = await new Promise<string>((resolve, reject) => {
      const child = spawn('git', gitArgs, {
        cwd: repoPath,
        windowsHide: true,
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
      child.stderr.on('data', (chunk) => stderrChunks.push(chunk));
      
      child.on('error', (err) => {
        reject(new Error(`Failed to start git grep: ${err.message}`));
      });

      child.on('close', (code) => {
        const stdoutData = Buffer.concat(stdoutChunks).toString('utf8');
        const stderrData = Buffer.concat(stderrChunks).toString('utf8');
        
        if (code === 0) {
          resolve(stdoutData);
        } else if (code === 1) {
          resolve(''); // No matches
        } else {
          reject(new Error(`Git grep exited with code ${code}: ${stderrData}`));
        }
      });
    });

    // Parse git grep output
    const matchesByFile: Record<string, SearchMatch[]> = {};
    let totalMatches = 0;

    if (output) {
      const lines = output.split(EOL);
      
      for (const line of lines) {
        if (!line.trim()) continue;

        // Format: file:lineNumber:lineContent
        const firstColonIndex = line.indexOf(':');
        if (firstColonIndex === -1) continue;

        const secondColonIndex = line.indexOf(':', firstColonIndex + 1);
        if (secondColonIndex === -1) continue;

        const filePath = line.substring(0, firstColonIndex);
        const lineNumberStr = line.substring(firstColonIndex + 1, secondColonIndex);
        const lineContent = line.substring(secondColonIndex + 1);

        const lineNumber = parseInt(lineNumberStr, 10);
        if (isNaN(lineNumber)) continue;

        if (!matchesByFile[filePath]) {
          matchesByFile[filePath] = [];
        }

        matchesByFile[filePath].push({
          filePath,
          lineNumber,
          line: lineContent.trim(),
        });
        totalMatches++;
      }
    }

    console.log('✓ Git grep: found', totalMatches, 'matches');

    return {
      success: true,
      strategy: 'git-grep',
      totalMatches,
      matchesByFile,
    };
  } catch (error: any) {
    console.log('Git grep failed:', error.message);
    return null; // Fallback to next strategy
  }
}

/**
 * Strategy 3: JavaScript fallback (fetch files via API and search)
 * - Slowest but most reliable
 * - Works for any GitHub repo
 * - No external dependencies
 */
async function searchWithJavaScript(
  octokit: Octokit,
  params: GitHubSearchParams
): Promise<SearchResult> {
  try {
    console.log('🔍 JavaScript fallback search...');

    // Get repository tree
    const { data: repoData } = await octokit.repos.get({
      owner: params.owner,
      repo: params.repo,
    });

    const defaultBranch = params.branch || repoData.default_branch;

    const { data: tree } = await octokit.git.getTree({
      owner: params.owner,
      repo: params.repo,
      tree_sha: defaultBranch,
      recursive: 'true',
    });

    // Filter files
    let files = tree.tree.filter(item => item.type === 'blob');

    // Apply path filter
    if (params.path) {
      files = files.filter(item => item.path?.startsWith(params.path!));
    }

    // Apply include pattern filter
    if (params.include) {
      const pattern = params.include
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\{/g, '(')
        .replace(/\}/g, ')')
        .replace(/,/g, '|');
      const regex = new RegExp(pattern + '$');
      files = files.filter(item => item.path && regex.test(item.path));
    }

    console.log(`Searching in ${files.length} files...`);

    const matchesByFile: Record<string, SearchMatch[]> = {};
    let totalMatches = 0;
    let filesProcessed = 0;

    // Limit to avoid API rate limits
    const maxFiles = Math.min(files.length, 50);

    for (const file of files.slice(0, maxFiles)) {
      if (!file.path) continue;

      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: params.owner,
          repo: params.repo,
          path: file.path,
          ref: defaultBranch,
        });

        if (Array.isArray(fileData) || fileData.type !== 'file') {
          continue;
        }

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const lines = content.split('\n');

        const regex = params.isRegex !== false
          ? new RegExp(params.pattern, 'i')
          : new RegExp(params.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const matches: SearchMatch[] = [];
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            matches.push({
              filePath: file.path!,
              lineNumber: index + 1,
              line: line.trim(),
            });
            totalMatches++;
          }
        });

        if (matches.length > 0) {
          matchesByFile[file.path] = matches;
        }

        filesProcessed++;
        
        // Add small delay to avoid rate limits
        if (filesProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.warn(`Failed to search in ${file.path}:`, err);
      }
    }

    console.log('✓ JavaScript search: found', totalMatches, 'matches in', filesProcessed, 'files');

    return {
      success: true,
      strategy: 'javascript',
      totalMatches,
      matchesByFile,
    };
  } catch (error: any) {
    console.error('JavaScript search failed:', error.message);
    return {
      success: false,
      strategy: 'none',
      totalMatches: 0,
      matchesByFile: {},
      error: error.message,
    };
  }
}

/**
 * Main search function with cascading strategies
 */
export async function performGitHubSearch(
  octokit: Octokit,
  params: GitHubSearchParams,
  localRepoPath?: string
): Promise<SearchResult> {
  console.log('🔎 Starting GitHub search with pattern:', params.pattern);

  // Strategy 1: GitHub Code Search API
  const apiResult = await searchWithGitHubAPI(octokit, params);
  if (apiResult && apiResult.totalMatches > 0) {
    return apiResult;
  }

  // Strategy 2: Local git grep (if repo is cloned)
  if (localRepoPath) {
    const gitResult = await searchWithGitGrep(localRepoPath, params);
    if (gitResult && gitResult.totalMatches > 0) {
      return gitResult;
    }
  }

  // Strategy 3: JavaScript fallback
  return await searchWithJavaScript(octokit, params);
}

/**
 * Format search results for display
 */
export function formatSearchResults(result: SearchResult): string {
  if (!result.success) {
    return `❌ Search failed: ${result.error || 'Unknown error'}`;
  }

  if (result.totalMatches === 0) {
    return '📭 No matches found';
  }

  const fileCount = Object.keys(result.matchesByFile).length;
  const matchTerm = result.totalMatches === 1 ? 'match' : 'matches';
  const fileTerm = fileCount === 1 ? 'file' : 'files';

  let output = `✅ Found ${result.totalMatches} ${matchTerm} in ${fileCount} ${fileTerm} (strategy: ${result.strategy})\n\n`;

  for (const [filePath, matches] of Object.entries(result.matchesByFile)) {
    output += `📄 ${filePath}\n`;
    
    // Limit matches per file to avoid overwhelming output
    const displayMatches = matches.slice(0, 10);
    for (const match of displayMatches) {
      output += `   L${match.lineNumber}: ${match.line}\n`;
    }
    
    if (matches.length > 10) {
      output += `   ... and ${matches.length - 10} more matches\n`;
    }
    
    output += '\n';
  }

  return output.trim();
}

/**
 * Create ADK tool for GitHub search
 */
export function createGitHubSearchTool() {
  return {
    name: 'bot_github_advanced_search',
    description: `🔍 ADVANCED CODE SEARCH: Multi-strategy search with automatic fallbacks

**SEARCH STRATEGIES (Automatic):**
1. **GitHub API** - Fast cloud-based search (tries first)
2. **Git Grep** - Local search if repo is cloned (fallback)
3. **JavaScript** - Pure JS fallback (always works)

**FEATURES:**
- ✅ Regex pattern support
- ✅ File pattern filtering (*.ts, *.{js,jsx})
- ✅ Path-based filtering
- ✅ Case-insensitive by default
- ✅ Line number results
- ✅ Grouped by file

**USE CASES:**
- Find function/class definitions
- Search for specific patterns
- Locate imports/dependencies
- Find TODO/FIXME comments
- Search error messages

**EXAMPLES:**
- Pattern: "function.*getUserProfile" (regex)
- Pattern: "TODO" (plain text)
- Include: "*.ts" (TypeScript files only)
- Path: "src/components" (search in specific directory)

**TIPS:**
- Use regex for flexible matching
- Add include pattern to limit scope
- Results show line numbers for quick navigation`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        pattern: {
          type: 'string',
          description: 'Search pattern (regex or plain text)',
        },
        path: {
          type: 'string',
          description: 'Optional: search within specific path (e.g., "src/components")',
        },
        include: {
          type: 'string',
          description: 'Optional: file pattern to include (e.g., "*.ts", "*.{js,jsx}")',
        },
        branch: {
          type: 'string',
          description: 'Optional: branch to search (defaults to default branch)',
        },
        isRegex: {
          type: 'boolean',
          description: 'Whether pattern is regex (default: true)',
        },
      },
      required: ['owner', 'repo', 'pattern'],
    },
  };
}
