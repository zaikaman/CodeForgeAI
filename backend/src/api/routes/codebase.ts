import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';
import { codebaseStorage } from '../../services/CodebaseStorageService';

const router = Router();

// Validation schemas
const uploadCodebaseSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string()
  })).min(1, 'At least one file is required'),
  generationId: z.string().uuid().optional(),
});

const readFilesSchema = z.object({
  snapshotId: z.string().uuid('Invalid snapshot ID'),
  filePaths: z.array(z.string()).min(1).max(20, 'Maximum 20 files per request'),
});

const searchFilesSchema = z.object({
  snapshotId: z.string().uuid('Invalid snapshot ID'),
  pattern: z.string().min(1, 'Pattern is required'),
});

/**
 * POST /api/codebase/upload
 * Upload codebase and create snapshot
 * Returns snapshot ID instead of sending all files in every request
 */
router.post('/codebase/upload', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate request
    const { files, generationId } = uploadCodebaseSchema.parse(req.body);

    console.log(`[POST /codebase/upload] Uploading ${files.length} files for user ${userId}`);

    // Create snapshot in storage
    const snapshot = await codebaseStorage.createSnapshot(userId, files, generationId);

    console.log(`[POST /codebase/upload] ✅ Snapshot created: ${snapshot.id}`);

    res.json({
      success: true,
      data: {
        snapshotId: snapshot.id,
        fileCount: snapshot.fileCount,
        totalSize: snapshot.totalSize,
        expiresAt: snapshot.expiresAt,
      },
    });
    return;
  } catch (error: any) {
    console.error('[POST /codebase/upload] Error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload codebase',
    });
    return;
  }
});

/**
 * GET /api/codebase/:snapshotId/manifest
 * Get list of files without content (lightweight)
 */
router.get('/codebase/:snapshotId/manifest', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { snapshotId } = req.params;

    const manifest = await codebaseStorage.getManifest(snapshotId, userId);

    res.json({
      success: true,
      data: manifest,
    });
    return;
  } catch (error: any) {
    console.error('[GET /codebase/manifest] Error:', error);
    res.status(404).json({
      success: false,
      error: 'Snapshot not found',
    });
    return;
  }
});

/**
 * POST /api/codebase/:snapshotId/read
 * Read specific files from snapshot (on-demand)
 */
router.post('/codebase/:snapshotId/read', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { snapshotId } = req.params;
    const { filePaths } = readFilesSchema.parse(req.body);

    console.log(`[POST /codebase/read] Reading ${filePaths.length} files from snapshot ${snapshotId}`);

    const files = await codebaseStorage.readFiles(snapshotId, userId, filePaths);

    res.json({
      success: true,
      data: {
        files,
        count: files.length,
      },
    });
    return;
  } catch (error: any) {
    console.error('[POST /codebase/read] Error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to read files',
    });
    return;
  }
});

/**
 * POST /api/codebase/:snapshotId/search
 * Search files by pattern
 */
router.post('/codebase/:snapshotId/search', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { snapshotId } = req.params;
    const { pattern } = searchFilesSchema.parse(req.body);

    const files = await codebaseStorage.searchFiles(snapshotId, userId, pattern);

    res.json({
      success: true,
      data: {
        files,
        count: files.length,
      },
    });
    return;
  } catch (error: any) {
    console.error('[POST /codebase/search] Error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search files',
    });
    return;
  }
});

/**
 * GET /api/codebase/:snapshotId/stats
 * Get snapshot statistics
 */
router.get('/codebase/:snapshotId/stats', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { snapshotId } = req.params;

    const stats = await codebaseStorage.getSnapshotStats(snapshotId, userId);

    res.json({
      success: true,
      data: stats,
    });
    return;
  } catch (error: any) {
    console.error('[GET /codebase/stats] Error:', error);
    res.status(404).json({
      success: false,
      error: 'Snapshot not found',
    });
    return;
  }
});

/**
 * DELETE /api/codebase/:snapshotId
 * Delete a snapshot
 */
router.delete('/codebase/:snapshotId', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { snapshotId } = req.params;

    await codebaseStorage.deleteSnapshot(snapshotId, userId);

    res.json({
      success: true,
      message: 'Snapshot deleted successfully',
    });
    return;
  } catch (error: any) {
    console.error('[DELETE /codebase] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete snapshot',
    });
    return;
  }
});

export default router;
