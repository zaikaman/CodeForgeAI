
import { Router } from 'express';
import { supabase } from '../../storage/SupabaseClient';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { generationQueue } from '../../services/GenerationQueue';
import { optionalAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

// Validation schema for generate request
const generateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  projectContext: z.string().optional(),
  targetLanguage: z.string().default('typescript'),
  complexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
  agents: z.array(z.string()).default(['CodeGenerator']),
  imageUrls: z.array(z.string()).optional(),
  autoPreview: z.boolean().default(true), // Auto-deploy to Fly.io after generation
});

// POST /generate - Start a new generation job (requires auth)
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to generate code.',
      });
      return;
    }

    // Validate request body
    const validatedRequest = generateRequestSchema.parse(req.body);
    
    // Create generation record with pending status
    const generationId = randomUUID();
    const { error: saveError } = await supabase
      .from('generations')
      .insert({
        id: generationId,
        user_id: userId, // Save user ID
        prompt: validatedRequest.prompt,
        target_language: validatedRequest.targetLanguage,
        complexity: validatedRequest.complexity,
        image_urls: validatedRequest.imageUrls || [],
        status: 'pending',
        files: null, // Will be populated when generation completes
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to create generation:', saveError);
      res.status(500).json({
        success: false,
        error: 'Failed to create generation',
      });
      return;
    }

    // Enqueue the generation job for background processing
    await generationQueue.enqueue({
      id: generationId,
      prompt: validatedRequest.prompt,
      projectContext: validatedRequest.projectContext,
      targetLanguage: validatedRequest.targetLanguage,
      complexity: validatedRequest.complexity,
      agents: validatedRequest.agents,
      imageUrls: validatedRequest.imageUrls,
      autoPreview: validatedRequest.autoPreview, // Pass through autoPreview flag
    });

    // Return immediately with the generation ID
    res.json({
      success: true,
      data: {
        id: generationId,
        status: 'pending',
        message: 'Generation started. Use the ID to check status.',
      },
    });
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
      error: error.message || 'Failed to start generation',
    });
    return;
  }
});

// GET /generate/:id - Get generation status and results (requires auth)
router.get('/generate/:id', optionalAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { id } = req.params;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to view generations.',
      });
      return;
    }

    // Fetch generation from database (only if it belongs to the user)
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Only get user's own generations
      .single();

    if (error || !generation) {
      res.status(404).json({
        success: false,
        error: 'Generation not found or you do not have permission to view it',
      });
      return;
    }

    // Return generation status and data
    res.json({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
        targetLanguage: generation.target_language,
        complexity: generation.complexity,
        files: generation.files,
        agentThoughts: generation.agent_thoughts,
        error: generation.error,
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
      },
    });
    return;
  } catch (error: any) {
    console.error('Error fetching generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch generation',
    });
    return;
  }
});

export default router;
