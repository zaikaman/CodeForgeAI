import { Router } from 'express';
import { PreviewService } from '../../services/preview/PreviewService';
import { supabase } from '../../storage/SupabaseClient';

const router = Router();

router.post('/preview', async (req, res) => {
  try {
    const { generationId } = req.body;

    // 1. Retrieve the generated files from the database
    const { data: generationData, error: generationError } = await supabase
      .from('generations')
      .select('files')
      .eq('id', generationId)
      .single();

    if (generationError) {
      throw new Error(generationError.message);
    }

    const files = generationData.files as Array<{ path: string; content: string }>;

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
