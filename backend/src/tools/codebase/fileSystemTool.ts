/**
 * File System Tool for LLM Agents
 * Provides selective file reading from codebase snapshots
 * 
 * Instead of receiving all files upfront, LLM can:
 * 1. List available files (manifest)
 * 2. Read specific files on-demand
 * 3. Search files by pattern
 * 
 * This dramatically reduces token usage!
 */

import { createTool } from '@iqai/adk';
import { z } from 'zod';
import { codebaseStorage } from '../../services/CodebaseStorageService';

/**
 * Tool: List files in codebase snapshot
 * Returns file metadata without content
 */
export const listFilesTool = createTool({
  name: 'list_codebase_files',
  description: `List all files in the current codebase snapshot.
Returns file paths, sizes, and languages without reading content.
Use this to understand project structure before reading specific files.`,
  schema: z.object({
    snapshotId: z.string().describe('Codebase snapshot ID from context'),
    userId: z.string().describe('User ID from context'),
    pattern: z.string().optional().describe('Optional glob pattern to filter files (e.g., "src/**/*.ts")'),
  }),
  fn: async ({ snapshotId, userId, pattern }) => {
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
});

/**
 * Tool: Read specific files from snapshot
 * LLM requests only the files it needs to analyze
 */
export const readFilesTool = createTool({
  name: 'read_codebase_files',
  description: `Read content of specific files from the codebase snapshot.
Only request files you need to analyze - don't read everything at once!
Be selective to minimize token usage.`,
  schema: z.object({
    snapshotId: z.string().describe('Codebase snapshot ID from context'),
    userId: z.string().describe('User ID from context'),
    filePaths: z.array(z.string()).describe('Array of file paths to read (e.g., ["src/index.ts", "package.json"])'),
  }),
  fn: async ({ snapshotId, userId, filePaths }) => {
    try {
      // Limit to prevent token overflow
      if (filePaths.length > 20) {
        return {
          success: false,
          error: 'Too many files requested at once. Maximum 20 files per request.',
        };
      }

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
});

/**
 * Tool: Read a single file
 * Convenience wrapper for reading one file
 */
export const readFileTool = createTool({
  name: 'read_codebase_file',
  description: `Read content of a single file from the codebase snapshot.
Use this when you need to examine one specific file.`,
  schema: z.object({
    snapshotId: z.string().describe('Codebase snapshot ID from context'),
    userId: z.string().describe('User ID from context'),
    filePath: z.string().describe('Path to the file to read (e.g., "src/index.ts")'),
  }),
  fn: async ({ snapshotId, userId, filePath }) => {
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
});

/**
 * Tool: Search files by pattern
 * Find files matching a glob pattern
 */
export const searchFilesTool = createTool({
  name: 'search_codebase_files',
  description: `Search for files matching a glob pattern.
Useful for finding specific types of files (e.g., all tests, all components).
Patterns: "*.ts" (all TS files), "src/**/*.test.ts" (all tests in src), "**/*.css" (all CSS files)`,
  schema: z.object({
    snapshotId: z.string().describe('Codebase snapshot ID from context'),
    userId: z.string().describe('User ID from context'),
    pattern: z.string().describe('Glob pattern to match files (supports * and ?)'),
  }),
  fn: async ({ snapshotId, userId, pattern }) => {
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
});

/**
 * Tool: Get codebase statistics
 * Overview of the project without reading files
 */
export const getCodebaseStatsTool = createTool({
  name: 'get_codebase_stats',
  description: `Get statistics about the codebase snapshot.
Returns file count, total size, and language breakdown.
Use this to understand the project before diving into specific files.`,
  schema: z.object({
    snapshotId: z.string().describe('Codebase snapshot ID from context'),
    userId: z.string().describe('User ID from context'),
  }),
  fn: async ({ snapshotId, userId }) => {
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
});

/**
 * Export all file system tools
 */
export const fileSystemTools = {
  listFiles: listFilesTool,
  readFiles: readFilesTool,
  readFile: readFileTool,
  searchFiles: searchFilesTool,
  getStats: getCodebaseStatsTool,
};
