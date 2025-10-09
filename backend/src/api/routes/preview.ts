import { Router } from 'express';
import { PreviewService } from '../../services/preview/PreviewService';
import { PreviewServiceWithRetry } from '../../services/preview/PreviewServiceWithRetry';
import { supabase } from '../../storage/SupabaseClient';

const router = Router();

router.post('/preview', async (req, res) => {
  try {
    const { generationId, files: providedFiles, useRetry = true, maxRetries = 3 } = req.body;

    let files: Array<{ path: string; content: string }>;
    let existingPreviewUrl: string | null = null;

    // If files are provided directly in the request, use them
    if (providedFiles && Array.isArray(providedFiles) && providedFiles.length > 0) {
      files = providedFiles;
      
      // Check if preview_url already exists in database
      const { data: generationData } = await supabase
        .from('generations')
        .select('preview_url')
        .eq('id', generationId)
        .maybeSingle();
      
      existingPreviewUrl = generationData?.preview_url || null;
    } else {
      // Otherwise, retrieve the generated files from the database
      const { data: generationData, error: generationError } = await supabase
        .from('generations')
        .select('files, preview_url')
        .eq('id', generationId)
        .maybeSingle();

      if (generationError) {
        throw new Error(generationError.message);
      }

      if (!generationData) {
        return res.status(404).json({ 
          success: false, 
          error: 'Generation not found in database. Please ensure files are provided in the request.' 
        });
      }

      files = generationData.files as Array<{ path: string; content: string }>;
      existingPreviewUrl = generationData.preview_url || null;
    }

    // If preview_url already exists and no force flag, return existing URL
    const forceRegenerate = req.body.forceRegenerate === true;
    if (existingPreviewUrl && !forceRegenerate) {
      console.log(`Preview URL already exists for ${generationId}, returning cached URL`);
      return res.json({ 
        success: true, 
        data: { 
          previewUrl: existingPreviewUrl,
          cached: true
        } 
      });
    }

    // 2. Generate the preview with or without retry mechanism
    if (useRetry) {
      console.log(`Using retry mechanism with max ${maxRetries} retries`);
      console.log(`Generation ID: ${generationId}`);
      console.log(`Files count: ${files.length}`);
      
      const previewService = new PreviewServiceWithRetry(maxRetries);
      
      // Add timeout for the entire deployment process (10 minutes)
      const deploymentTimeout = 600000; // 10 minutes
      const deploymentPromise = previewService.generatePreviewWithRetry(generationId, files, maxRetries);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Deployment process timeout after 10 minutes')), deploymentTimeout)
      );

      const result = await Promise.race([deploymentPromise, timeoutPromise]);

      if (result.success) {
        // Persist preview URL to database
        try {
          await supabase
            .from('generations')
            .update({ preview_url: result.previewUrl })
            .eq('id', generationId);
          console.log(`✓ Preview URL persisted to database: ${result.previewUrl}`);
        } catch (persistError) {
          console.warn('Failed to persist preview_url:', persistError);
        }

        res.json({ 
          success: true, 
          data: { 
            previewUrl: result.previewUrl,
            attempt: result.attempt,
            logs: result.logs
          } 
        });
      } else {
        console.error(`✗ Deployment failed after ${result.attempt} attempts`);
        console.error(`   Error: ${result.error}`);
        res.status(500).json({ 
          success: false, 
          error: result.error,
          logs: result.logs,
          attempt: result.attempt
        });
      }
    } else {
      console.log('Using standard preview service (no retry)');
      const previewService = new PreviewService();
      const result = await previewService.generatePreview(generationId, files);

      // Persist preview URL to database
      try {
        await supabase
          .from('generations')
          .update({ preview_url: result.previewUrl })
          .eq('id', generationId);
      } catch (persistError) {
        console.warn('Failed to persist preview_url:', persistError);
      }

      res.json({ success: true, data: result });
    }
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
