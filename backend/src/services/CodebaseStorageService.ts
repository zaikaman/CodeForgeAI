/**
 * Codebase Storage Service
 * Manages efficient storage and retrieval of codebase snapshots using Supabase Storage
 * 
 * PROBLEM: Sending entire codebase in every API request wastes bandwidth and tokens
 * SOLUTION: Store files in Supabase Storage, send only snapshot references
 * 
 * Flow:
 * 1. Client uploads codebase → Server creates snapshot → Returns snapshotId
 * 2. Client sends chat/generate request with snapshotId (not full files)
 * 3. LLM uses tools to selectively read files it needs
 */

import { supabase } from '../storage/SupabaseClient';
import { randomUUID } from 'crypto';

export interface CodeFile {
  path: string;
  content: string;
}

export interface CodebaseSnapshot {
  id: string;
  userId: string;
  generationId?: string;
  fileCount: number;
  totalSize: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface FileMetadata {
  path: string;
  size: number;
  extension: string;
  language?: string;
}

export class CodebaseStorageService {
  private readonly BUCKET_NAME = 'project-files';
  private readonly SNAPSHOT_EXPIRY_DAYS = 7; // Auto-cleanup after 7 days

  /**
   * Upload codebase and create a snapshot
   * Stores files in Supabase Storage and creates a manifest
   */
  async createSnapshot(
    userId: string,
    files: CodeFile[],
    generationId?: string
  ): Promise<CodebaseSnapshot> {
    const snapshotId = randomUUID();
    const timestamp = new Date().toISOString();

    console.log(`[CodebaseStorage] Creating snapshot ${snapshotId} with ${files.length} files`);

    // Calculate total size and metadata
    let totalSize = 0;
    const fileMetadata: FileMetadata[] = [];

    for (const file of files) {
      const size = Buffer.byteLength(file.content, 'utf8');
      totalSize += size;

      const extension = file.path.split('.').pop() || '';
      fileMetadata.push({
        path: file.path,
        size,
        extension,
        language: this.detectLanguage(extension),
      });
    }

    // Create manifest (index of all files)
    const manifest = {
      snapshotId,
      userId,
      generationId,
      fileCount: files.length,
      totalSize,
      files: fileMetadata,
      createdAt: timestamp,
    };

    // Upload manifest first
    const manifestPath = `${userId}/${snapshotId}/manifest.json`;
    const { error: manifestError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(manifestPath, JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });

    if (manifestError) {
      console.error('[CodebaseStorage] Failed to upload manifest:', manifestError);
      throw new Error(`Failed to create snapshot manifest: ${manifestError.message}`);
    }

    // Upload each file
    const uploadPromises = files.map(async (file) => {
      const filePath = `${userId}/${snapshotId}/files/${file.path}`;
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file.content, {
          contentType: this.getContentType(file.path),
          upsert: true,
        });

      if (error) {
        console.error(`[CodebaseStorage] Failed to upload ${file.path}:`, error);
        throw new Error(`Failed to upload file ${file.path}: ${error.message}`);
      }

      return filePath;
    });

    await Promise.all(uploadPromises);

    console.log(`[CodebaseStorage] ✅ Snapshot ${snapshotId} created successfully`);

    // Store snapshot metadata in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SNAPSHOT_EXPIRY_DAYS);

    const { error: dbError } = await supabase
      .from('codebase_snapshots')
      .insert({
        id: snapshotId,
        user_id: userId,
        generation_id: generationId,
        file_count: files.length,
        total_size: totalSize,
        created_at: timestamp,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.warn('[CodebaseStorage] Failed to store snapshot metadata:', dbError);
      // Don't fail the request, files are already uploaded
    }

    return {
      id: snapshotId,
      userId,
      generationId,
      fileCount: files.length,
      totalSize,
      createdAt: new Date(timestamp),
      expiresAt,
    };
  }

  /**
   * Get snapshot manifest (list of files without content)
   * Used by LLM to see what files are available
   */
  async getManifest(snapshotId: string, userId: string): Promise<any> {
    const manifestPath = `${userId}/${snapshotId}/manifest.json`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(manifestPath);

    if (error) {
      console.error('[CodebaseStorage] Failed to download manifest:', error);
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const manifestText = await data.text();
    return JSON.parse(manifestText);
  }

  /**
   * Read specific files from snapshot
   * LLM calls this to load only the files it needs
   */
  async readFiles(
    snapshotId: string,
    userId: string,
    filePaths: string[]
  ): Promise<CodeFile[]> {
    console.log(`[CodebaseStorage] Reading ${filePaths.length} files from snapshot ${snapshotId}`);

    const downloadPromises = filePaths.map(async (filePath) => {
      const storagePath = `${userId}/${snapshotId}/files/${filePath}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(storagePath);

      if (error) {
        console.error(`[CodebaseStorage] Failed to download ${filePath}:`, error);
        return null;
      }

      const content = await data.text();
      return { path: filePath, content };
    });

    const results = await Promise.all(downloadPromises);
    return results.filter((file): file is CodeFile => file !== null);
  }

  /**
   * Read a single file from snapshot
   */
  async readFile(
    snapshotId: string,
    userId: string,
    filePath: string
  ): Promise<CodeFile | null> {
    const files = await this.readFiles(snapshotId, userId, [filePath]);
    return files[0] || null;
  }

  /**
   * Search files by pattern (glob-like)
   */
  async searchFiles(
    snapshotId: string,
    userId: string,
    pattern: string
  ): Promise<FileMetadata[]> {
    const manifest = await this.getManifest(snapshotId, userId);
    
    // Convert glob pattern to regex
    const regex = new RegExp(
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );

    return manifest.files.filter((file: FileMetadata) => regex.test(file.path));
  }

  /**
   * Delete a snapshot (cleanup)
   */
  async deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
    console.log(`[CodebaseStorage] Deleting snapshot ${snapshotId}`);

    const prefix = `${userId}/${snapshotId}`;
    
    // List all files in snapshot
    const { data: files, error: listError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(prefix, { limit: 1000 });

    if (listError) {
      console.error('[CodebaseStorage] Failed to list files for deletion:', listError);
      throw new Error(`Failed to delete snapshot: ${listError.message}`);
    }

    // Delete all files
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${prefix}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        console.error('[CodebaseStorage] Failed to delete files:', deleteError);
        throw new Error(`Failed to delete snapshot files: ${deleteError.message}`);
      }
    }

    // Delete metadata from database
    await supabase
      .from('codebase_snapshots')
      .delete()
      .eq('id', snapshotId)
      .eq('user_id', userId);

    console.log(`[CodebaseStorage] ✅ Snapshot ${snapshotId} deleted`);
  }

  /**
   * Cleanup expired snapshots
   */
  async cleanupExpiredSnapshots(): Promise<number> {
    console.log('[CodebaseStorage] Cleaning up expired snapshots...');

    const { data: expiredSnapshots, error } = await supabase
      .from('codebase_snapshots')
      .select('id, user_id')
      .lt('expires_at', new Date().toISOString());

    if (error || !expiredSnapshots) {
      console.error('[CodebaseStorage] Failed to fetch expired snapshots:', error);
      return 0;
    }

    let deletedCount = 0;
    for (const snapshot of expiredSnapshots) {
      try {
        await this.deleteSnapshot(snapshot.id, snapshot.user_id);
        deletedCount++;
      } catch (error) {
        console.error(`[CodebaseStorage] Failed to delete expired snapshot ${snapshot.id}:`, error);
      }
    }

    console.log(`[CodebaseStorage] ✅ Cleaned up ${deletedCount} expired snapshots`);
    return deletedCount;
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStats(snapshotId: string, userId: string): Promise<any> {
    const manifest = await this.getManifest(snapshotId, userId);

    const languageStats: Record<string, number> = {};

    for (const file of manifest.files) {
      const lang = file.language || 'unknown';
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    }

    return {
      snapshotId,
      fileCount: manifest.fileCount,
      totalSize: manifest.totalSize,
      languages: languageStats,
      createdAt: manifest.createdAt,
    };
  }

  // Helper methods

  private detectLanguage(extension: string): string | undefined {
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
    };

    return languageMap[extension.toLowerCase()];
  }

  private getContentType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    const contentTypes: Record<string, string> = {
      js: 'application/javascript',
      ts: 'application/typescript',
      jsx: 'application/javascript',
      tsx: 'application/typescript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      txt: 'text/plain',
      py: 'text/x-python',
      java: 'text/x-java',
      cpp: 'text/x-c++src',
      c: 'text/x-csrc',
    };

    return contentTypes[extension] || 'text/plain';
  }
}

// Export singleton instance
export const codebaseStorage = new CodebaseStorageService();
