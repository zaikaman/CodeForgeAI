import { Router } from 'express';
import { ChatMemoryManager } from '../../services/ChatMemoryManager';
import { chatQueue } from '../../services/ChatQueue';
import { supabase } from '../../storage/SupabaseClient';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const router = Router();

// Validation schema for chat request
const chatRequestSchema = z.object({
  generationId: z.string().min(1, 'Generation ID is required'),
  message: z.string().min(1, 'Message is required'),
  currentFiles: z.array(z.object({
    path: z.string(),
    content: z.string()
  })),
  language: z.string().default('typescript'),
  imageUrls: z.array(z.string()).optional(),
});

// POST /chat - Start a chat request as background job (returns immediately)
router.post('/chat', async (req, res): Promise<void> => {
  try {
    // Validate request body
    const validatedRequest = chatRequestSchema.parse(req.body);
    
    const { generationId, message, currentFiles, language, imageUrls } = validatedRequest;

    // Create unique job ID
    const jobId = randomUUID();

    // Ensure generation exists in DB before storing chat messages
    const { data: existingGeneration } = await supabase
      .from('generations')
      .select('id')
      .eq('id', generationId)
      .single();

    if (!existingGeneration) {
      console.warn(`⚠ Generation ${generationId} not found in DB, creating placeholder...`);
      
      // Create a placeholder generation record
      const { error: createError } = await supabase
        .from('generations')
        .insert({
          id: generationId,
          user_id: null, // Will be set when user logs in
          prompt: 'Chat session',
          target_language: language,
          complexity: 'moderate',
          status: 'completed',
          files: currentFiles,
        });

      if (createError) {
        console.error('Failed to create placeholder generation:', createError);
      } else {
        console.log(`✅ Created placeholder generation ${generationId}`);
      }
    }

    // Store user message in memory (but don't fail if it errors)
    const userMessageStored = await ChatMemoryManager.storeMessage({
      generationId,
      role: 'user',
      content: message,
      imageUrls: imageUrls || [],
    });

    if (!userMessageStored) {
      console.warn('⚠ Failed to store user message, continuing anyway...');
    }

    // Enqueue the chat job for background processing
    await chatQueue.enqueue({
      id: jobId,
      generationId,
      message,
      currentFiles,
      language,
      imageUrls,
    });

    // Return immediately with job ID
    res.json({
      success: true,
      data: {
        jobId,
        status: 'pending',
        message: 'Chat request queued. Use job ID to check status.',
      },
    });
    return;
  } catch (error: any) {
    console.error('Chat error:', error);
    
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
      error: error.message || 'Chat request failed',
    });
    return;
  }
});

// GET /chat/:jobId - Get chat job status and result
router.get('/chat/:jobId', async (req, res): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = chatQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Chat job not found or expired',
      });
      return;
    }

    // Return job status
    const responseData: any = {
      success: true,
      data: {
        jobId: job.id,
        generationId: job.generationId,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    };

    // Include result if completed
    if (job.status === 'completed' && job.result) {
      // Validate that files are properly formatted before sending
      try {
        if (job.result.files && Array.isArray(job.result.files)) {
          // Ensure all files have valid path and content
          const validatedFiles = job.result.files.map((file: any) => {
            if (!file.path || typeof file.path !== 'string') {
              throw new Error('Invalid file path');
            }
            if (file.content === undefined || file.content === null) {
              throw new Error(`File ${file.path} has no content`);
            }
            if (typeof file.content !== 'string') {
              return {
                path: file.path,
                content: JSON.stringify(file.content, null, 2)
              };
            }
            return {
              path: file.path,
              content: file.content
            };
          });
          
          responseData.data.files = validatedFiles;
        }
      } catch (validationError: any) {
        console.error('[ChatRoute] File validation error:', validationError);
        responseData.data.error = `File validation failed: ${validationError.message}`;
        responseData.data.status = 'error';
        delete responseData.data.files;
      }
      
      responseData.data.agentThought = {
        agent: 'ChatAgent',
        thought: job.result.summary || 'Changes applied successfully',
      };
    }

    // Include error if failed
    if (job.status === 'error') {
      responseData.data.error = job.error;
    }

    // Final validation: ensure response is JSON-serializable
    try {
      JSON.stringify(responseData);
    } catch (jsonError: any) {
      console.error('[ChatRoute] Response is not JSON-serializable:', jsonError);
      res.status(500).json({
        success: false,
        error: 'Internal server error: Invalid response format',
      });
      return;
    }

    res.json(responseData);
    return;
  } catch (error: any) {
    console.error('Error fetching chat job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch chat job',
    });
    return;
  }
});

export default router;
