
import { Router } from 'express';
import { GenerateWorkflow } from '../../workflows/GenerateWorkflow';
import { supabase } from '../../storage/SupabaseClient';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const router = Router();

// Validation schema for generate request
const generateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectContext: z.string().optional(),
  includeTests: z.boolean().default(true),
  includeDocumentation: z.boolean().default(true),
  targetLanguage: z.string().default('typescript'),
  complexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
  agents: z.array(z.string()).default(['CodeGenerator', 'TestCrafter']),
});

router.post('/generate', async (req, res): Promise<void> => {
  try {
    // Validate request body
    const validatedRequest = generateRequestSchema.parse(req.body);
    
    // Create and run workflow
    const generateWorkflow = new GenerateWorkflow();
    const result = await generateWorkflow.run(validatedRequest);

    // Save generation to database
    const generationId = randomUUID();
    const { data: generationData, error: saveError } = await supabase
      .from('generations')
      .insert({
        id: generationId,
        prompt: validatedRequest.prompt,
        files: result.files,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save generation:', saveError);
      // Continue even if save fails
    }

    const response = {
      success: true,
      data: {
        id: generationData?.id,
        files: result.files,
        language: validatedRequest.targetLanguage,
        agentThoughts: result.agentThoughts,
      },
    };

    res.json(response);
    return;
  } catch (error: any) {
    console.error('Generation error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      error: error.message || 'Code generation failed',
    });
    return;
  }
});

export default router;
