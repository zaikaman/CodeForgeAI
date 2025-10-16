/**
 * Repository FileSystem Cache
 * 
 * Local filesystem-based caching system for GitHub repositories
 * Dramatically reduces GitHub API calls and improves agent performance
 * 
 * Features:
 * - Clone and cache entire repositories locally
 * - Fast file access without API calls
 * - Git operations (grep, log, diff) for advanced searches
 * - Automatic cleanup and expiration
 * - Memory and disk-based dual caching
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import crypto from 'crypto';

/**
 * Configuration for filesystem cache
 */
export interface FileCacheConfig {
  maxCacheSize: number; // bytes, default 1GB
  cacheTTL: number; // milliseconds, default 1 hour
  maxRepositories: number; // default 10
  compressionEnabled: boolean; // gzip compression
}

/**
 * Cache entry metadata
 */
interface CacheEntry {
  key: string;
  owner: string;
  repo: string;
  branch: string;
  type: 'repository' | 'file' | 'tree';
  path?: string; // for file entries
  size: number;
  hash: string;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  ttl: number;
}

/**
 * Repository cache info
 */
interface RepositoryCacheInfo {
  owner: string;
  repo: string;
  branch: string;
  localPath: string;
  clonedAt: number;
  lastPulledAt: number;
  fileCount: number;
  totalSize: number;
  gitSha: string;
}

/**
 * Search result from git grep
 */
interface GitGrepResult {
  file: string;
  line: number;
  content: string;
  match: string;
}

/**
 * Main repository filesystem cache class
 */
export class RepositoryFileSystemCache {
  private cacheDir: string;
  private config: FileCacheConfig;
  private memoryCache: Map<string, { data: any; entry: CacheEntry }> = new Map();
  private repositoryIndex: Map<string, RepositoryCacheInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(_config: Partial<FileCacheConfig> = {}) {
    // Apply default config
    this.config = {
      maxCacheSize: _config.maxCacheSize ?? 1024 * 1024 * 1024, // 1GB
      cacheTTL: _config.cacheTTL ?? 60 * 60 * 1000, // 1 hour
      maxRepositories: _config.maxRepositories ?? 10,
      compressionEnabled: _config.compressionEnabled ?? false,
    };

    // Set cache directory
    this.cacheDir = path.join(os.tmpdir(), 'codeforge-agent-cache');

    // Initialize
    this.initialize();

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Initialize cache directory
   */
  private async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log(`[RepositoryFileSystemCache] Initialized at ${this.cacheDir}`);
      await this.loadRepositoryIndex();
    } catch (error) {
      console.error('[RepositoryFileSystemCache] Initialization error:', error);
    }
  }

  /**
   * Clone or update a repository
   */
  async ensureRepository(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<RepositoryCacheInfo> {
    const repoKey = `${owner}/${repo}`;
    const localPath = path.join(this.cacheDir, 'repos', owner, repo);

    // Check if already cached
    const cached = this.repositoryIndex.get(repoKey);
    if (cached && cached.branch === branch) {
      const ageMs = Date.now() - cached.lastPulledAt;
      if (ageMs < this.config.cacheTTL) {
        console.log(
          `[RepositoryFileSystemCache] Using cached repo ${repoKey}@${branch} (age: ${Math.round(ageMs / 1000)}s)`
        );
        return cached;
      }
    }

    console.log(`[RepositoryFileSystemCache] Cloning/updating ${repoKey}@${branch}...`);

    try {
      // Ensure directory exists
      await fs.mkdir(localPath, { recursive: true });

      const cloneUrl = `https://github.com/${owner}/${repo}.git`;

      // Check if already cloned
      const gitDir = path.join(localPath, '.git');
      const isCloned = await this.fileExists(gitDir);

      if (isCloned) {
        // Update existing repo
        this.execGit(localPath, ['fetch', 'origin', branch]);
        this.execGit(localPath, ['checkout', branch]);
      } else {
        // New clone
        this.execGit('', ['clone', '--depth', '1', '--branch', branch, cloneUrl, localPath]);
      }

      // Get current SHA
      const sha = this.execGit(localPath, ['rev-parse', 'HEAD']).trim();

      // Count files and size
      const { fileCount, totalSize } = await this.analyzeRepoSize(localPath);

      const info: RepositoryCacheInfo = {
        owner,
        repo,
        branch,
        localPath,
        clonedAt: cached?.clonedAt || Date.now(),
        lastPulledAt: Date.now(),
        fileCount,
        totalSize,
        gitSha: sha,
      };

      this.repositoryIndex.set(repoKey, info);
      await this.saveRepositoryIndex();

      console.log(
        `[RepositoryFileSystemCache] Ready: ${repoKey}@${branch} (${fileCount} files, ${this.formatBytes(totalSize)})`
      );

      return info;
    } catch (error: any) {
      console.error(`[RepositoryFileSystemCache] Error cloning ${repoKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Get file content from cache
   */
  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    branch: string = 'main'
  ): Promise<string> {
    const cacheKey = `file:${owner}/${repo}/${branch}/${filePath}`;

    // Check memory cache first
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry && !this.isExpired(memEntry.entry)) {
      memEntry.entry.accessedAt = Date.now();
      memEntry.entry.accessCount++;
      return memEntry.data;
    }

    try {
      const repoInfo = await this.ensureRepository(owner, repo, branch);
      const fullPath = path.join(repoInfo.localPath, filePath);

      // Security check
      if (!fullPath.startsWith(repoInfo.localPath)) {
        throw new Error('Path traversal attempt detected');
      }

      const content = await fs.readFile(fullPath, 'utf-8');

      // Store in memory cache
      const entry: CacheEntry = {
        key: cacheKey,
        owner,
        repo,
        branch,
        path: filePath,
        type: 'file',
        size: Buffer.byteLength(content),
        hash: this.hashContent(content),
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 1,
        ttl: this.config.cacheTTL,
      };

      this.memoryCache.set(cacheKey, { data: content, entry });
      console.log(`[RepositoryFileSystemCache] Cached file ${filePath} from ${cacheKey}`);

      return content;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`[RepositoryFileSystemCache] File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Search files using git grep (very fast)
   */
  async searchFiles(
    owner: string,
    repo: string,
    pattern: string,
    branch: string = 'main',
    filePattern?: string
  ): Promise<GitGrepResult[]> {
    try {
      const repoInfo = await this.ensureRepository(owner, repo, branch);

      // Build grep command
      const args = ['grep', '-n', '--color=never'];

      if (filePattern) {
        args.push('--', filePattern);
      }

      args.push(pattern);

      try {
        const output = this.execGit(repoInfo.localPath, args);
        const results: GitGrepResult[] = [];

        // Parse output: file:line:content
        for (const line of output.split('\n')) {
          if (!line.trim()) continue;

          const match = line.match(/^([^:]+):(\d+):(.*)$/);
          if (match) {
            results.push({
              file: match[1],
              line: parseInt(match[2]),
              content: match[3],
              match: pattern,
            });
          }
        }

        console.log(
          `[RepositoryFileSystemCache] Found ${results.length} matches for "${pattern}" in ${owner}/${repo}`
        );

        return results;
      } catch (error: any) {
        // git grep returns non-zero if no matches found
        if (error.status === 1) {
          return [];
        }
        throw error;
      }
    } catch (error) {
      console.error(`[RepositoryFileSystemCache] Search error:`, error);
      throw error;
    }
  }

  /**
   * Get file tree structure
   */
  async getFileTree(
    owner: string,
    repo: string,
    branch: string = 'main',
    dirPath: string = ''
  ): Promise<
    Array<{
      path: string;
      type: 'file' | 'directory';
      size?: number;
    }>
  > {
    try {
      const repoInfo = await this.ensureRepository(owner, repo, branch);
      const fullPath = path.join(repoInfo.localPath, dirPath);

      // Security check
      if (!fullPath.startsWith(repoInfo.localPath)) {
        throw new Error('Path traversal attempt detected');
      }

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const result = [];

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name === '.git') continue;

        const entryPath = path.join(dirPath, entry.name);
        const fullEntryPath = path.join(fullPath, entry.name);

        if (entry.isDirectory()) {
          result.push({
            path: entryPath,
            type: 'directory' as const,
          });
        } else {
          const stat = await fs.stat(fullEntryPath);
          result.push({
            path: entryPath,
            type: 'file' as const,
            size: stat.size,
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`[RepositoryFileSystemCache] Tree error:`, error);
      throw error;
    }
  }

  /**
   * Edit file locally and return new content
   */
  async editFile(
    owner: string,
    repo: string,
    filePath: string,
    oldContent: string,
    newContent: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
      const repoInfo = await this.ensureRepository(owner, repo, branch);
      const fullPath = path.join(repoInfo.localPath, filePath);

      // Security check
      if (!fullPath.startsWith(repoInfo.localPath)) {
        throw new Error('Path traversal attempt detected');
      }

      // Read current content
      const currentContent = await fs.readFile(fullPath, 'utf-8');

      // Verify old content matches
      if (!currentContent.includes(oldContent)) {
        throw new Error('Old content not found in file');
      }

      // Replace
      const updated = currentContent.replace(oldContent, newContent);

      // Write back
      await fs.writeFile(fullPath, updated, 'utf-8');

      // Invalidate cache
      this.invalidateFileCache(owner, repo, filePath);

      console.log(
        `[RepositoryFileSystemCache] Updated ${filePath} in ${owner}/${repo}@${branch}`
      );

      return updated;
    } catch (error) {
      console.error(`[RepositoryFileSystemCache] Edit error:`, error);
      throw error;
    }
  }

  /**
   * Get list of all modified files in working directory
   */
  async getModifiedFiles(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<
    Array<{
      path: string;
      status: 'modified' | 'added' | 'deleted';
      oldContent?: string;
      newContent?: string;
    }>
  > {
    try {
      const repoInfo = await this.ensureRepository(owner, repo, branch);

      // Get diff
      const diffOutput = this.execGit(repoInfo.localPath, [
        'diff',
        '--name-status',
        'HEAD',
      ]);

      const results = [];

      for (const line of diffOutput.split('\n')) {
        if (!line.trim()) continue;

        const [status, filePath] = line.split('\t');
        results.push({
          path: filePath,
          status: (status === 'M' ? 'modified' : status === 'A' ? 'added' : 'deleted') as
            | 'modified'
            | 'added'
            | 'deleted',
        });
      }

      console.log(
        `[RepositoryFileSystemCache] Found ${results.length} modified files in ${owner}/${repo}`
      );

      return results;
    } catch (error) {
      console.error(`[RepositoryFileSystemCache] Modified files error:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let memoryUsage = 0;
    let validEntries = 0;

    for (const [, entry] of this.memoryCache) {
      if (!this.isExpired(entry.entry)) {
        memoryUsage += entry.entry.size;
        validEntries++;
      }
    }

    return {
      memoryCache: {
        entries: validEntries,
        totalSize: this.formatBytes(memoryUsage),
        maxSize: this.formatBytes(this.config.maxCacheSize),
      },
      repositories: Array.from(this.repositoryIndex.values()).map((info) => ({
        key: `${info.owner}/${info.repo}`,
        branch: info.branch,
        path: info.localPath,
        fileCount: info.fileCount,
        size: this.formatBytes(info.totalSize),
        age: this.formatTime(Date.now() - info.lastPulledAt),
      })),
    };
  }

  /**
   * Clear cache for specific repository
   */
  async clearRepository(owner: string, repo: string) {
    const repoKey = `${owner}/${repo}`;
    const info = this.repositoryIndex.get(repoKey);

    if (info) {
      try {
        await fs.rm(info.localPath, { recursive: true, force: true });
        this.repositoryIndex.delete(repoKey);
        await this.saveRepositoryIndex();

        // Also clear memory cache entries for this repo
        for (const key of this.memoryCache.keys()) {
          if (key.includes(`${owner}/${repo}`)) {
            this.memoryCache.delete(key);
          }
        }

        console.log(`[RepositoryFileSystemCache] Cleared cache for ${repoKey}`);
      } catch (error) {
        console.error(`[RepositoryFileSystemCache] Clear error:`, error);
      }
    }
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      this.memoryCache.clear();
      this.repositoryIndex.clear();
      console.log(`[RepositoryFileSystemCache] Cleared all caches`);
    } catch (error) {
      console.error(`[RepositoryFileSystemCache] Clear all error:`, error);
    }
  }

  // ============ Private methods ============

  /**
   * Execute git command
   */
  private execGit(cwd: string, args: string[]): string {
    try {
      const command = `git ${args.join(' ')}`;
      const output = execSync(command, {
        cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      return output;
    } catch (error: any) {
      error.status = error.status || 1;
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hash content
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if cache entry expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * Invalidate file cache
   */
  private invalidateFileCache(owner: string, repo: string, filePath: string) {
    const prefix = `file:${owner}/${repo}`;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix) && key.includes(filePath)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Analyze repository size
   */
  private async analyzeRepoSize(
    repoPath: string
  ): Promise<{ fileCount: number; totalSize: number }> {
    let fileCount = 0;
    let totalSize = 0;

    const scanDir = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '.git') continue;

          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else {
            fileCount++;
            const stat = await fs.stat(fullPath);
            totalSize += stat.size;
          }
        }
      } catch (error) {
        console.warn(`[RepositoryFileSystemCache] Error scanning ${dir}:`, error);
      }
    };

    await scanDir(repoPath);
    return { fileCount, totalSize };
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform cleanup
   */
  private performCleanup() {
    // Remove expired memory cache entries
    let removed = 0;
    for (const [key, entry] of this.memoryCache) {
      if (this.isExpired(entry.entry)) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(
        `[RepositoryFileSystemCache] Cleaned up ${removed} expired cache entries`
      );
    }

    // Log stats
    console.log('[RepositoryFileSystemCache] Stats:', JSON.stringify(this.getStats(), null, 2));
  }

  /**
   * Save repository index
   */
  private async saveRepositoryIndex() {
    try {
      const indexPath = path.join(this.cacheDir, 'repo-index.json');
      const data = Array.from(this.repositoryIndex.values());
      await fs.writeFile(indexPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('[RepositoryFileSystemCache] Error saving index:', error);
    }
  }

  /**
   * Load repository index
   */
  private async loadRepositoryIndex() {
    try {
      const indexPath = path.join(this.cacheDir, 'repo-index.json');
      if (await this.fileExists(indexPath)) {
        const data = await fs.readFile(indexPath, 'utf-8');
        const repos: RepositoryCacheInfo[] = JSON.parse(data);
        for (const repo of repos) {
          this.repositoryIndex.set(`${repo.owner}/${repo.repo}`, repo);
        }
        console.log(
          `[RepositoryFileSystemCache] Loaded ${repos.length} repositories from index`
        );
      }
    } catch (error) {
      console.warn('[RepositoryFileSystemCache] Error loading index:', error);
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format time duration
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
