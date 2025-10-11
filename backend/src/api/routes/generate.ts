
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
    const hasAuthHeader = req.headers.authorization ? 'YES' : 'NO';
    
    console.log(`[POST /generate] Request received. Auth header: ${hasAuthHeader}, UserId: ${userId || 'NOT AUTHENTICATED'}`);
    
    // Check if user is authenticated
    if (!userId) {
      console.warn('[POST /generate] No userId found - authentication failed');
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
    console.log(`[POST /generate] Creating generation ${generationId} for user ${userId}`);
    
    const { data: newGeneration, error: saveError } = await supabase
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
      console.error('[POST /generate] Failed to create generation:', saveError);
      res.status(500).json({
        success: false,
        error: 'Failed to create generation',
        details: saveError.message,
      });
      return;
    }

    console.log(`[POST /generate] Generation ${generationId} created successfully. User ID saved: ${newGeneration?.user_id}`);

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

    console.log(`[GET /generate/${id}] Request received. UserId: ${userId || 'NOT AUTHENTICATED'}`);

    // Check if user is authenticated
    if (!userId) {
      console.warn(`[GET /generate/${id}] No userId found - authentication failed`);
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to view generations.',
      });
      return;
    }

    // First, check if generation exists at all
    const { data: generationCheck, error: checkError } = await supabase
      .from('generations')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !generationCheck) {
      console.error(`[GET /generate/${id}] Generation not found in database. Error:`, checkError);
      res.status(404).json({
        success: false,
        error: 'Generation not found',
        details: checkError?.message || 'No generation record exists with this ID',
      });
      return;
    }

    // Check if user owns this generation
    if (generationCheck.user_id !== userId) {
      console.warn(`[GET /generate/${id}] Permission denied. Generation belongs to user ${generationCheck.user_id}, request from ${userId}`);
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this generation',
        details: 'This generation belongs to a different user',
      });
      return;
    }

    // Fetch full generation from database
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !generation) {
      console.error(`[GET /generate/${id}] Failed to fetch generation details:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch generation details',
        details: error?.message,
      });
      return;
    }

    console.log(`[GET /generate/${id}] Successfully fetched generation. Status: ${generation.status}`);

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
        previewUrl: generation.preview_url, // Include preview URL from database
        deploymentStatus: generation.deployment_status,
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
