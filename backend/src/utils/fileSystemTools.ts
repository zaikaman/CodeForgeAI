/**
 * File System Tools Helper for ChatAgent
 * Creates file system tools with user context (snapshotId + userId)
 */

import { createTool } from '@iqai/adk';
import { z } from 'zod';
import { codebaseStorage } from '../services/CodebaseStorageService';

export interface FileSystemContext {
  snapshotId: string;
  userId: string;
}

/**
 * Create file system tools for agent with snapshot context
 * These tools allow LLM to read files on-demand instead of receiving all files upfront
 */
export function createFileSystemTools(context: FileSystemContext) {
  const { snapshotId, userId } = context;

  const tools = [
    // Tool 1: List all files in snapshot
    createTool({
      name: 'list_codebase_files',
      description: `List all files in the current codebase snapshot.
Returns file paths, sizes, and languages without reading content.
Use this FIRST to understand the project structure before reading specific files.`,
      schema: z.object({
        pattern: z.string().optional().describe('Optional glob pattern to filter files (e.g., "src/**/*.ts", "**/*.test.ts")'),
      }),
      fn: async ({ pattern }) => {
        try {
          if (pattern) {
            const files = await codebaseStorage.searchFiles(snapshotId, userId, pattern);
            return {
              success: true,
              files: files.map(f => ({
                path: f.path,
                size: f.size,
                language: f.language,
              })),
              count: files.length,
            };
          }

          const manifest = await codebaseStorage.getManifest(snapshotId, userId);
          return {
            success: true,
            files: manifest.files.map((f: any) => ({
              path: f.path,
              size: f.size,
              language: f.language,
            })),
            count: manifest.fileCount,
            totalSize: manifest.totalSize,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    // Tool 2: Read specific files
    createTool({
      name: 'read_codebase_files',
      description: `Read content of specific files from the codebase.
IMPORTANT: Only request files you need to analyze - don't read everything!
Be selective to minimize token usage. Max 10 files per call.`,
      schema: z.object({
        filePaths: z.array(z.string()).max(10).describe('Array of file paths to read (e.g., ["src/index.ts", "package.json"])'),
      }),
      fn: async ({ filePaths }) => {
        try {
          const files = await codebaseStorage.readFiles(snapshotId, userId, filePaths);
          
          return {
            success: true,
            files: files.map(f => ({
              path: f.path,
              content: f.content,
              size: Buffer.byteLength(f.content, 'utf8'),
            })),
            count: files.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    // Tool 3: Read a single file (convenience)
    createTool({
      name: 'read_codebase_file',
      description: `Read content of a single file from the codebase.
Use this when you need to examine one specific file.`,
      schema: z.object({
        filePath: z.string().describe('Path to the file to read (e.g., "src/index.ts")'),
      }),
      fn: async ({ filePath }) => {
        try {
          const file = await codebaseStorage.readFile(snapshotId, userId, filePath);
          
          if (!file) {
            return {
              success: false,
              error: `File not found: ${filePath}`,
            };
          }

          return {
            success: true,
            path: file.path,
            content: file.content,
            size: Buffer.byteLength(file.content, 'utf8'),
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    // Tool 4: Search files by pattern
    createTool({
      name: 'search_codebase_files',
      description: `Search for files matching a glob pattern.
Useful for finding specific types of files (e.g., all tests, all components).
Patterns: "*.ts" (all TS files), "src/**/*.test.ts" (all tests in src), "**/*.css" (all CSS files)`,
      schema: z.object({
        pattern: z.string().describe('Glob pattern to match files (supports * and ?)'),
      }),
      fn: async ({ pattern }) => {
        try {
          const files = await codebaseStorage.searchFiles(snapshotId, userId, pattern);
          
          return {
            success: true,
            files: files.map(f => ({
              path: f.path,
              size: f.size,
              language: f.language,
            })),
            count: files.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
    }),

    // Tool 5: Get codebase statistics
    createTool({
      name: 'get_codebase_stats',
      description: `Get statistics about the codebase.
Returns file count, total size, and language breakdown.
Use this to understand the project overview without reading files.`,
      schema: z.object({}),
      fn: async () => {
        try {
          const stats = await codebaseStorage.getSnapshotStats(snapshotId, userId);
          
          return {
            success: true,
            ...stats,
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

  return {
    tools,
    description: FILE_SYSTEM_TOOLS_DESCRIPTION,
  };
}

/**
 * Description of file system tools for system prompt
 */
export const FILE_SYSTEM_TOOLS_DESCRIPTION = `
**CODEBASE FILE SYSTEM:**
You have access to the user's codebase through a file system. Instead of receiving all files upfront, you can read files on-demand.

Available tools:
- list_codebase_files() - See all available files (lightweight)
- read_codebase_file(filePath) - Read a single file
- read_codebase_files(filePaths[]) - Read multiple files (max 10)
- search_codebase_files(pattern) - Find files matching pattern
- get_codebase_stats() - Get project overview

**IMPORTANT WORKFLOW:**
1. ALWAYS start with list_codebase_files() to see what's available
2. Read ONLY the files you need for the task (be selective!)
3. Don't read all files - it wastes tokens and is slow
4. Use search_codebase_files() to find specific file types

**EXAMPLES:**
User: "Fix the login bug"
→ You: list_codebase_files() to see structure
→ You: search_codebase_files("**/*login*") to find login-related files
→ You: read_codebase_file("src/Login.tsx") to analyze the bug
→ You: Make fixes and return modified file

User: "Add tests for API"
→ You: search_codebase_files("**/api/**/*.ts") to find API files
→ You: read_codebase_files(["src/api/users.ts", "src/api/auth.ts"])
→ You: Generate test files

**TOKEN EFFICIENCY:**
- Old way: Receive 50 files (100K tokens) even if you only need 2 files
- New way: Read 2 files on-demand (5K tokens) = 95% savings! 🎉
`;
