import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../../storage/SupabaseClient';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * VAPI Tool Call Request Schema
 * This matches the format that VAPI sends when calling tools
 */
const vapiToolCallSchema = z.object({
  message: z.object({
    type: z.literal('tool-calls'),
    toolCallList: z.array(z.object({
      id: z.string(),
      name: z.string(),
      arguments: z.record(z.string(), z.any()),
    })),
    call: z.object({
      id: z.string(),
      orgId: z.string().optional(),
    }).optional(),
    assistant: z.object({
      name: z.string().optional(),
    }).optional(),
  }),
});

/**
 * POST /api/vapi/tools - Handle VAPI tool calls
 * 
 * This endpoint receives function calls from VAPI voice assistant
 * and creates background jobs in CodeForge
 */
router.post('/tools', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[VAPI Tools] Received tool call request');
    console.log('[VAPI Tools] Request body:', JSON.stringify(req.body, null, 2));

    // Validate request
    const validatedRequest = vapiToolCallSchema.parse(req.body);
    const { toolCallList, call } = validatedRequest.message;

    // Process each tool call
    const results = await Promise.all(
      toolCallList.map(async (toolCall) => {
        console.log(`[VAPI Tools] Processing tool: ${toolCall.name}`);
        console.log(`[VAPI Tools] Arguments:`, toolCall.arguments);

        try {
          // Handle create_code_task function
          if (toolCall.name === 'create_code_task') {
            const args = toolCall.arguments as {
              task_description: string;
              project_type: string;
              language?: string;
              create_repo?: string | boolean; // Can be "yes"/"no" or boolean
              repo_name?: string;
            };
            
            // Normalize create_repo to boolean
            const create_repo = typeof args.create_repo === 'string' 
              ? args.create_repo.toLowerCase() === 'yes'
              : Boolean(args.create_repo);
            
            const {
              task_description,
              project_type,
              language,
              repo_name,
            } = args;

            // Extract user_id from task description (passed in system message)
            // In production, you'd use proper authentication
            // For now, we'll extract from the system context or use a default
            const userId = extractUserIdFromContext(req);

            if (!userId) {
              return {
                toolCallId: toolCall.id,
                result: JSON.stringify({
                  success: false,
                  error: 'User authentication required. Please ensure you are logged in.',
                }),
              };
            }

            // Create a new generation ID for this background job
            const generationId = randomUUID();

            // Build the user message for the background job
            let userMessage = task_description;
            
            if (create_repo && repo_name) {
              userMessage = `Create a new GitHub repository named "${repo_name}" with ${task_description}`;
            }

            // Add language context if specified
            if (language) {
              userMessage += `. Use ${language}.`;
            }

            console.log(`[VAPI Tools] Creating background job for user ${userId}`);
            console.log(`[VAPI Tools] Message: ${userMessage}`);

            // Create generation record
            const { error: genError } = await supabase
              .from('generations')
              .insert({
                id: generationId,
                user_id: userId,
                prompt: userMessage.slice(0, 500),
                target_language: language || 'auto-detect',
                complexity: 'moderate',
                status: 'processing',
                files: [],
                created_at: new Date().toISOString(),
              });

            if (genError) {
              console.error('[VAPI Tools] Failed to create generation:', genError);
              return {
                toolCallId: toolCall.id,
                result: JSON.stringify({
                  success: false,
                  error: 'Failed to create code generation session',
                }),
              };
            }

            // Get user's GitHub context from settings
            const { data: userSettings } = await supabase
              .from('user_settings')
              .select('github_username, github_token')
              .eq('user_id', userId)
              .single();

            const githubContext = userSettings?.github_token ? {
              token: userSettings.github_token,
              username: userSettings.github_username,
            } : undefined;

            // Create background job
            const { data: job, error: jobError } = await supabase
              .from('background_jobs')
              .insert({
                user_id: userId,
                session_id: generationId,
                type: 'agent_task',
                status: 'pending',
                user_message: userMessage,
                context: {
                  project_type,
                  language,
                  create_repo,
                  repo_name,
                  githubContext,
                  source: 'vapi_voice_call',
                  call_id: call?.id,
                },
                progress: 0,
              })
              .select()
              .single();

            if (jobError || !job) {
              console.error('[VAPI Tools] Failed to create background job:', jobError);
              return {
                toolCallId: toolCall.id,
                result: JSON.stringify({
                  success: false,
                  error: 'Failed to create background job',
                }),
              };
            }

            console.log(`[VAPI Tools] ✅ Background job created: ${job.id}`);

            // Return success result
            const resultMessage = create_repo
              ? `Perfect! I've started creating your ${project_type} in a new repository called "${repo_name}". Your job ID is ${job.id}. You can monitor the progress in the Background Jobs panel.`
              : `Great! I've started working on your ${project_type}. Job ID: ${job.id}. Check the Background Jobs panel to see the progress.`;

            return {
              toolCallId: toolCall.id,
              result: JSON.stringify({
                success: true,
                job_id: job.id,
                generation_id: generationId,
                message: resultMessage,
                status: 'Job is now running in the background',
              }),
            };
          }

          // Unknown tool
          return {
            toolCallId: toolCall.id,
            result: JSON.stringify({
              success: false,
              error: `Unknown tool: ${toolCall.name}`,
            }),
          };
        } catch (toolError: any) {
          console.error(`[VAPI Tools] Error processing tool ${toolCall.name}:`, toolError);
          return {
            toolCallId: toolCall.id,
            result: JSON.stringify({
              success: false,
              error: toolError.message || 'Tool execution failed',
            }),
          };
        }
      })
    );

    // Return results in VAPI format
    res.json({
      results,
    });
  } catch (error: any) {
    console.error('[VAPI Tools] Error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        results: [{
          toolCallId: 'error',
          result: JSON.stringify({
            success: false,
            error: 'Invalid request format',
            details: error.errors,
          }),
        }],
      });
      return;
    }

    res.status(500).json({
      results: [{
        toolCallId: 'error',
        result: JSON.stringify({
          success: false,
          error: error.message || 'Internal server error',
        }),
      }],
    });
  }
});

/**
 * Extract user ID from request context
 * VAPI sends serverUrlSecret in x-vapi-secret header
 */
function extractUserIdFromContext(req: Request): string | null {
  // Try to get from VAPI secret header (we use this to pass user ID)
  const vapiSecret = req.headers['x-vapi-secret'] as string;
  if (vapiSecret) {
    console.log('[VAPI Tools] Found user ID in x-vapi-secret header:', vapiSecret);
    return vapiSecret;
  }

  // Try to get from Authorization header (if using Supabase auth)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    // In production, verify the JWT and extract user_id
    // For now, we'll use a different approach
  }

  // Try to get from custom header (set by frontend)
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    return userId;
  }

  // Fallback: extract from request body if included
  const bodyUserId = (req.body as any).userId;
  if (bodyUserId) {
    return bodyUserId;
  }

  console.warn('[VAPI Tools] Could not extract user ID from request');
  return null;
}

export default router;
