/**
 * Codebase Upload Hook
 * Handles uploading project files to storage and managing snapshots
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export interface CodeFile {
  path: string;
  content: string;
}

export interface SnapshotInfo {
  snapshotId: string;
  fileCount: number;
  totalSize: number;
  expiresAt?: string;
}

export interface UseCodebaseUploadReturn {
  upload: (files: CodeFile[], generationId?: string) => Promise<SnapshotInfo>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  currentSnapshot: SnapshotInfo | null;
}

export function useCodebaseUpload(): UseCodebaseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<SnapshotInfo | null>(null);

  const upload = useCallback(async (files: CodeFile[], generationId?: string): Promise<SnapshotInfo> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      console.log(`[CodebaseUpload] Uploading ${files.length} files...`);

      // Simulate progress (since upload is single request)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiClient.post('/api/codebase/upload', {
        files,
        generationId,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.data || !response.data.snapshotId) {
        throw new Error('Invalid response from server');
      }

      const snapshotInfo: SnapshotInfo = {
        snapshotId: response.data.snapshotId,
        fileCount: response.data.fileCount,
        totalSize: response.data.totalSize,
        expiresAt: response.data.expiresAt,
      };

      setCurrentSnapshot(snapshotInfo);
      console.log(`[CodebaseUpload] ✅ Upload complete: ${snapshotInfo.snapshotId}`);

      return snapshotInfo;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError(errorMessage);
      console.error('[CodebaseUpload] Error:', errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    upload,
    isUploading,
    uploadProgress,
    error,
    currentSnapshot,
  };
}
