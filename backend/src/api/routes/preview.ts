import { Router } from 'express';
import { PreviewService } from '../../services/preview/PreviewService';
import { supabase } from '../../storage/SupabaseClient';

const router = Router();

router.post('/preview', async (req, res) => {
  try {
    const { generationId, files: providedFiles } = req.body;

    let files: Array<{ path: string; content: string }>;

    // If files are provided directly in the request, use them
    if (providedFiles && Array.isArray(providedFiles) && providedFiles.length > 0) {
      files = providedFiles;
    } else {
      // Otherwise, retrieve the generated files from the database
      const { data: generationData, error: generationError } = await supabase
        .from('generations')
        .select('files')
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
    }

    // 2. Generate the preview
    const previewService = new PreviewService();
    const result = await previewService.generatePreview(generationId, files);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
