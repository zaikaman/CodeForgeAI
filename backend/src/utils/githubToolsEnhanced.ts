/**
 * Enhanced GitHub Tools with Codebase Analysis
 * 
 * Extends bot GitHub tools with advanced codebase analysis capabilities
 * for better understanding of complex projects
 */

import { createTool } from '@iqai/adk';
import { z } from 'zod';
import { CodebaseAnalyzer } from './codebaseAnalyzer';
import { createBotGitHubTools, BOT_GITHUB_TOOLS_DESCRIPTION } from './githubToolsWithBot';
import { getConfig } from './config';

/**
 * Create enhanced GitHub tools with codebase analysis
 */
export function createEnhancedGitHubTools() {
  const config = getConfig();
  
  if (!config.codeforgebotGithubToken) {
    throw new Error('CODEFORGE_BOT_GITHUB_TOKEN not configured. Bot operations are unavailable.');
  }

  const botToken = config.codeforgebotGithubToken;
  
  // Get base bot tools
  const botTools = createBotGitHubTools();
  
  // Create analyzer instance
  const analyzer = new CodebaseAnalyzer(botToken);

  // Add enhanced analysis tools
  const enhancedTools = [
    createTool({
      name: 'bot_github_analyze_codebase',
      description: `🧠 CRITICAL TOOL: Analyze entire codebase structure, architecture, and complexity.
      
USE THIS FIRST when working with unknown/complex repositories!

Returns comprehensive analysis:
- Project complexity level (simple/moderate/complex/very-complex)
- Languages and frameworks used
- Project structure and organization
- Entry points and key files
- Build tools and test frameworks
- Recommendations for approaching the codebase

This tool provides the "big picture" understanding needed before making changes.

NOTE: Automatically detects the default branch (main/master) if not specified.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().optional().describe('Branch to analyze (auto-detects default if not provided)'),
      }),
      fn: async (args) => {
        try {
          const analysis = await analyzer.analyzeCodebase(args.owner, args.repo, args.branch);
          const report = analyzer.generateAnalysisReport(analysis);
          
          return {
            success: true,
            analysis: {
              complexity: analysis.complexity,
              fileCount: analysis.fileCount,
              estimatedLines: analysis.estimatedLines,
              languages: Object.fromEntries(analysis.languages),
              frameworks: analysis.frameworks,
              buildTools: analysis.buildTools,
              testFrameworks: analysis.testFrameworks,
              entryPoints: analysis.entryPoints,
              keyFiles: analysis.keyFiles.slice(0, 20), // Top 20 key files
            },
            report,
            message: `✅ Analyzed ${args.owner}/${args.repo} - Complexity: ${analysis.complexity.toUpperCase()}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to analyze codebase: ${error.message}`,
          };
        }
      },
    }),

    createTool({
      name: 'bot_github_find_related_files',
      description: `🔍 Find files related to specific keywords or issue context.

Smart search that:
- Searches code for keywords
- Extracts file paths mentioned in issue descriptions
- Ranks results by relevance
- Returns actionable list of files to review

Use when you need to find code related to a bug/feature before modifying.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        keywords: z.array(z.string()).describe('Keywords to search for (function names, error messages, feature names)'),
        issueContext: z.string().optional().describe('Full issue description for better context'),
      }),
      fn: async (args) => {
        try {
          const relatedFiles = await analyzer.findRelatedFiles(
            args.owner,
            args.repo,
            args.keywords,
            args.issueContext
          );
          
          return {
            success: true,
            files: relatedFiles,
            count: relatedFiles.length,
            message: `✅ Found ${relatedFiles.length} files related to: ${args.keywords.join(', ')}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to find related files: ${error.message}`,
          };
        }
      },
    }),

    createTool({
      name: 'bot_github_analyze_files_deep',
      description: `📊 Deep analysis of specific files including imports, exports, functions, classes, and complexity.

Returns detailed information about each file:
- File content
- Detected imports/exports
- Function and class definitions
- Code complexity metrics
- Relationships between files (dependency graph)

Use to understand specific files before modifying them.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        filePaths: z.array(z.string()).describe('Array of file paths to analyze'),
        branch: z.string().optional().describe('Branch name'),
      }),
      fn: async (args) => {
        try {
          const analysis = await analyzer.analyzeFiles(
            args.owner,
            args.repo,
            args.filePaths,
            args.branch
          );
          
          return {
            success: true,
            filesAnalyzed: analysis.files.length,
            files: analysis.files.map(f => ({
              path: f.path,
              language: f.language,
              lines: f.lines,
              complexity: f.complexity,
              functions: f.functions,
              classes: f.classes,
              imports: f.imports,
              exports: f.exports,
              // Include content only for small files to avoid token limits
              content: f.lines < 200 ? f.content : `[File too large - ${f.lines} lines. Use bot_github_get_file_content to read specific sections]`,
            })),
            relationships: analysis.relationships,
            message: `✅ Analyzed ${analysis.files.length} files in detail`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to analyze files: ${error.message}`,
          };
        }
      },
    }),

    createTool({
      name: 'bot_github_analyze_dependencies',
      description: `📦 Analyze project dependencies and package managers.

Returns:
- Detected package managers (npm, pip, bundler, etc.)
- Production dependencies
- Development dependencies
- Peer dependencies

Use to understand project dependencies before adding/modifying packages.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        branch: z.string().optional().describe('Branch name'),
      }),
      fn: async (args) => {
        try {
          const deps = await analyzer.analyzeDependencies(
            args.owner,
            args.repo,
            args.branch
          );
          
          return {
            success: true,
            packageManagers: deps.packageManagers,
            dependencies: deps.dependencies,
            devDependencies: deps.devDependencies,
            peerDependencies: deps.peerDependencies,
            totalDependencies: Object.keys(deps.dependencies).length,
            message: `✅ Found ${deps.packageManagers.join(', ')} with ${Object.keys(deps.dependencies).length} dependencies`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to analyze dependencies: ${error.message}`,
          };
        }
      },
    }),

    createTool({
      name: 'bot_github_get_issue_context',
      description: `🎯 Get full context for a specific issue including description, comments, and labels.

Returns comprehensive issue information:
- Issue title and body
- Labels and assignees
- All comments and discussions
- Related PRs (if mentioned)
- Current state

Use to fully understand an issue before starting work.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        issueNumber: z.number().describe('Issue number'),
      }),
      fn: async (args) => {
        try {
          const { Octokit } = await import('@octokit/rest');
          const client = new Octokit({ auth: botToken });
          
          // Get issue details
          const { data: issue } = await client.issues.get({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
          });
          
          // Get comments
          const { data: comments } = await client.issues.listComments({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issueNumber,
          });
          
          return {
            success: true,
            issue: {
              number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              labels: issue.labels.map((l: any) => l.name),
              assignees: issue.assignees?.map((a: any) => a.login) || [],
              createdAt: issue.created_at,
              updatedAt: issue.updated_at,
              author: issue.user?.login || 'unknown',
            },
            comments: comments.map((c: any) => ({
              author: c.user.login,
              body: c.body,
              createdAt: c.created_at,
            })),
            commentCount: comments.length,
            message: `✅ Retrieved issue #${args.issueNumber}: ${issue.title}`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to get issue context: ${error.message}`,
          };
        }
      },
    }),

    createTool({
      name: 'bot_github_smart_file_search',
      description: `🔎 Smart multi-pattern code search with ranking.

Searches for multiple patterns simultaneously and ranks results by relevance.
Better than individual searches when you have multiple keywords.

Use when exploring unfamiliar codebase or tracking down bugs.`,
      schema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        patterns: z.array(z.string()).describe('Search patterns (can use GitHub search syntax)'),
        maxResults: z.number().optional().default(30).describe('Max total results'),
      }),
      fn: async (args) => {
        try {
          const { Octokit } = await import('@octokit/rest');
          const client = new Octokit({ auth: botToken });
          
          const allResults: any[] = [];
          const seen = new Set<string>();
          
          for (const pattern of args.patterns) {
            try {
              const { data } = await client.search.code({
                q: `${pattern} repo:${args.owner}/${args.repo}`,
                per_page: Math.min(10, args.maxResults),
              });
              
              for (const item of data.items) {
                if (!seen.has(item.path) && allResults.length < args.maxResults) {
                  seen.add(item.path);
                  allResults.push({
                    path: item.path,
                    matchedPattern: pattern,
                    url: item.html_url,
                  });
                }
              }
            } catch (error) {
              // Continue with other patterns if one fails
              console.error(`Search failed for pattern: ${pattern}`);
            }
          }
          
          return {
            success: true,
            results: allResults,
            totalFound: allResults.length,
            patterns: args.patterns,
            message: `✅ Found ${allResults.length} files matching ${args.patterns.length} patterns`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            message: `❌ Failed to search files: ${error.message}`,
          };
        }
      },
    }),
  ];

  return {
    tools: [...botTools.tools, ...enhancedTools],
    botUsername: botTools.botUsername,
    botToken: botTools.botToken,
    analyzer, // Expose analyzer instance
  };
}

/**
 * Enhanced bot GitHub tools description
 */
export const ENHANCED_GITHUB_TOOLS_DESCRIPTION = `
${BOT_GITHUB_TOOLS_DESCRIPTION}

## 🧠 Advanced Codebase Analysis Tools (NEW!)

**Essential for Complex Issues:**

**1. bot_github_analyze_codebase** ⭐ USE THIS FIRST!
- Comprehensive project analysis
- Detects: languages, frameworks, build tools, test frameworks
- Provides complexity assessment
- Recommends approach based on project size
- Identifies entry points and key files
- **When to use**: First time working with a repo, or before major changes

**2. bot_github_find_related_files** ⭐ USE FOR ISSUE INVESTIGATION
- Smart keyword-based file search
- Extracts context from issue descriptions
- Returns ranked list of relevant files
- **When to use**: Finding code related to bug/feature

**3. bot_github_analyze_files_deep**
- Deep analysis of specific files
- Extracts: imports, exports, functions, classes
- Calculates complexity metrics
- Maps file relationships
- **When to use**: Understanding files before modification

**4. bot_github_analyze_dependencies**
- Detects package managers
- Lists all dependencies
- **When to use**: Before adding/updating packages

**5. bot_github_get_issue_context**
- Gets complete issue information
- Includes all comments and discussion
- **When to use**: Understanding requirements for an issue

**6. bot_github_smart_file_search**
- Multi-pattern code search
- Ranks results by relevance
- **When to use**: Exploring unfamiliar codebase

**📋 RECOMMENDED WORKFLOW FOR COMPLEX ISSUES:**

\`\`\`
Step 1: Understand the Repository
→ Use bot_github_analyze_codebase

Step 2: Get Issue Details
→ Use bot_github_get_issue_context (if working on specific issue)

Step 3: Find Relevant Code
→ Use bot_github_find_related_files or bot_github_smart_file_search

Step 4: Analyze Key Files
→ Use bot_github_analyze_files_deep on identified files

Step 5: Check Dependencies (if needed)
→ Use bot_github_analyze_dependencies

Step 6: Read Specific Code
→ Use bot_github_get_file_content for detailed reading

Step 7: Implement Solution
→ Use fork → branch → push → PR workflow
\`\`\`

**💡 PRO TIPS:**

- **Always start with analysis** - Don't jump to coding
- **Use caching** - Analysis results are cached to save API calls
- **Be selective** - Analyze only what you need (avoid token limits)
- **Follow the workflow** - Systematic approach = better results
`;

export default createEnhancedGitHubTools;
