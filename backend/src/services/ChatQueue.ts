/**
 * ChatQueue - Manages chat requests as background jobs to avoid Heroku 30s timeout
 * Similar to GenerationQueue pattern
 */

import { ChatAgent } from '../agents/specialized/ChatAgent';
import { ChatMemoryManager } from './ChatMemoryManager';
import { supabase } from '../storage/SupabaseClient';
import { safeAgentCall } from '../utils/agentHelpers';

interface ChatJob {
  id: string;
  generationId: string;
  userId: string;
  message: string;
  currentFiles: Array<{ path: string; content: string }>;
  language?: string; // Optional - let workflow auto-detect
  imageUrls?: string[];
  githubContext?: {
    token: string;
    username: string;
    email?: string;
  };
  specialistAgent?: string; // Force routing to specific agent (e.g., 'CodeModification')
  errorContext?: string; // Detailed error information for error fixing tasks
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    files: Array<{ path: string; content: string }>;
    summary: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ChatQueueManager {
  private queue: ChatJob[] = [];
  private isProcessing = false;

  /**
   * Enqueue a chat request - saves to Supabase
   */
  async enqueue(params: {
    id: string;
    generationId: string;
    userId: string;
    message: string;
    currentFiles: Array<{ path: string; content: string }>;
    language?: string; // Optional - let workflow auto-detect
    imageUrls?: string[];
    githubContext?: {
      token: string;
      username: string;
      email?: string;
    };
    specialistAgent?: string; // Force routing to specific agent
    errorContext?: string; // Detailed error information for error fixing
  }): Promise<void> {
    console.log(`[ChatQueue] Creating chat job ${params.id} in database...`);
    
    // Check if job already exists
    const { data: existingJob } = await supabase
      .from('chat_jobs')
      .select('id, status')
      .eq('id', params.id)
      .single();
    
    if (existingJob) {
      console.log(`[ChatQueue] Job ${params.id} already exists with status: ${existingJob.status}`);
      
      // If job is already pending, check if it's in our queue
      if (existingJob.status === 'pending') {
        const inQueue = this.queue.some(j => j.id === params.id);
        if (inQueue) {
          console.log(`[ChatQueue] Job ${params.id} already in queue, skipping`);
          return;
        }
        // Job exists in DB but not in queue, load it
        console.log(`[ChatQueue] Job ${params.id} exists in DB but not in queue, adding to queue`);
        const job: ChatJob = {
          id: params.id,
          generationId: params.generationId,
          userId: params.userId,
          message: params.message,
          currentFiles: params.currentFiles,
          language: params.language,
          imageUrls: params.imageUrls,
          githubContext: params.githubContext,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.queue.push(job);
        
        // Start processing if not already
        if (!this.isProcessing) {
          this.processQueue();
        }
        return;
      }
      
      // If already processing, skip
      if (existingJob.status === 'processing') {
        console.log(`[ChatQueue] Job ${params.id} is already being processed, skipping`);
        return;
      }
      
      // If completed/error, delete and recreate
      console.log(`[ChatQueue] Job ${params.id} status is ${existingJob.status}, recreating`);
      await supabase.from('chat_jobs').delete().eq('id', params.id);
    }
    
    // Save to database
    const { error: dbError } = await supabase
      .from('chat_jobs')
      .insert({
        id: params.id,
        generation_id: params.generationId,
        user_id: params.userId,
        message: params.message,
        current_files: params.currentFiles,
        language: params.language,
        image_urls: params.imageUrls || [],
        status: 'pending',
      });
    
    if (dbError) {
      console.error(`[ChatQueue] Failed to create chat job in database:`, dbError);
      throw new Error('Failed to create chat job');
    }

    const job: ChatJob = {
      id: params.id,
      generationId: params.generationId,
      userId: params.userId,
      message: params.message,
      currentFiles: params.currentFiles,
      language: params.language,
      imageUrls: params.imageUrls,
      githubContext: params.githubContext,
      specialistAgent: params.specialistAgent, // Add specialist agent
      errorContext: params.errorContext, // Add error context
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    
    console.log(`[ChatQueue] Enqueued chat job ${params.id} for generation ${params.generationId}${params.specialistAgent ? ` (force route to ${params.specialistAgent})` : ''}${params.errorContext ? ' with error context' : ''}`);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Get job by ID from database
   */
  async getJob(id: string): Promise<ChatJob | null> {
    const { data, error } = await supabase
      .from('chat_jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      generationId: data.generation_id,
      userId: data.user_id,
      message: data.message,
      currentFiles: data.current_files,
      language: data.language,
      imageUrls: data.image_urls,
      status: data.status,
      result: data.result,
      error: data.error,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      await this.processJob(job);
    }

    this.isProcessing = false;
  }

  /**
   * Emit progress update for realtime frontend tracking
   */
  private async emitProgress(jobId: string, agent: string, status: 'started' | 'completed' | 'error', message: string): Promise<void> {
    try {
      const progressMessage = {
        timestamp: new Date().toISOString(),
        agent,
        status,
        message,
      };

      // Fetch current progress messages
      const { data: job } = await supabase
        .from('chat_jobs')
        .select('progress_messages')
        .eq('id', jobId)
        .single();

      const currentMessages = job?.progress_messages || [];
      const updatedMessages = [...currentMessages, progressMessage];

      // Update with new progress message
      await supabase
        .from('chat_jobs')
        .update({ progress_messages: updatedMessages })
        .eq('id', jobId);

      console.log(`[ChatQueue Progress] ${agent} - ${status}: ${message}`);
    } catch (error) {
      console.error('[ChatQueue Progress] Failed to emit:', error);
    }
  }

  /**
   * Process a single chat job
   */
  private async processJob(job: ChatJob): Promise<void> {
    console.log(`[ChatQueue] Processing chat job ${job.id}...`);
    
    try {
      // Update status in database
      job.status = 'processing';
      job.updatedAt = new Date();
      
      await supabase
        .from('chat_jobs')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Check if specialist agent is forced (skip ChatAgent routing)
      let specialistAgent = job.specialistAgent;
      let needsSpecialist = !!specialistAgent;
      
      if (!specialistAgent) {
        // No forced agent, use ChatAgent to determine routing
        await this.emitProgress(job.id, 'ChatAgent', 'started', 'Analyzing your request and determining the best approach...');

        // Build context with conversation history
        const { contextMessage, totalTokens, historyImageUrls } = await ChatMemoryManager.buildContext(
          job.generationId,
          job.message,
          job.currentFiles,
          job.language,
          job.imageUrls
        );

        console.log(`[ChatQueue] Chat context built: ${totalTokens} estimated tokens`);

        // Log GitHub context status
        if (job.githubContext) {
          console.log(`[ChatQueue] GitHub context available for user: ${job.githubContext.username}`);
        } else {
          console.log(`[ChatQueue] No GitHub context provided`);
        }

        // Use ChatAgent with improved error handling and GitHub context
        const { runner } = await ChatAgent(job.githubContext);
        
        // Build the message with images if provided
        // Combine current images with images from conversation history
        const allImageUrls = [...(job.imageUrls || []), ...historyImageUrls];
        let chatMessage: any;
        
        if (allImageUrls.length > 0) {
          console.log(`[ChatQueue] Including ${allImageUrls.length} images (${job.imageUrls?.length || 0} current + ${historyImageUrls.length} from history)`);
          
          // Download images and convert to base64
          const imageParts = await Promise.all(
            allImageUrls.map(async (url) => {
              try {
                const response = await globalThis.fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64 = buffer.toString('base64');
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                
                return {
                  inline_data: {
                    mime_type: contentType,
                    data: base64
                  }
                };
              } catch (error) {
                console.error(`[ChatQueue] Failed to fetch image from ${url}:`, error);
                return null;
              }
            })
          );
          
          const validImageParts = imageParts.filter(part => part !== null);
          const textPart = { text: contextMessage };
          chatMessage = { parts: [textPart, ...validImageParts] };
        } else {
          chatMessage = contextMessage;
        }

        // Use safe agent call with automatic retry and validation
        const response = await safeAgentCall(runner, chatMessage, {
          maxRetries: 3,
          retryDelay: 1000,
          context: 'ChatQueue'
        }) as any; // Cast to any to access githubOperation field
        
        // Check if ChatAgent determined a specialist is needed
        needsSpecialist = response.needsSpecialist || false;
        specialistAgent = response.specialistAgent || '';
        
        // Debug: Log the full response to see what ChatAgent returned
        console.log(`[ChatQueue] ChatAgent response:`, JSON.stringify({
          needsSpecialist: response.needsSpecialist,
          specialistAgent: response.specialistAgent,
          summary: response.summary?.substring(0, 100)
        }, null, 2));
        
        // If no specialist needed, handle as conversational response or simple code generation
        if (!needsSpecialist) {
          // Check if this is a conversational response (no files) or code changes
          const isConversational = !response.files || response.files.length === 0;
          
          let updatedFiles: Array<{ path: string; content: string }> = [...job.currentFiles];
          
          if (!isConversational && response.files) {
            // Merge modified/new files with existing files
            const responseFilesMap = new Map<string, { path: string; content: string }>(
              response.files.map((f: any) => [f.path, f as { path: string; content: string }])
            );
            
            updatedFiles = job.currentFiles.map(originalFile => {
              const modifiedFile = responseFilesMap.get(originalFile.path);
              if (modifiedFile) {
                responseFilesMap.delete(originalFile.path);
                return modifiedFile;
              }
              return originalFile;
            });
            
            responseFilesMap.forEach((newFile: { path: string; content: string }) => {
              updatedFiles.push(newFile);
            });
          }

          // Store assistant response in memory
          await ChatMemoryManager.storeMessage({
            generationId: job.generationId,
            role: 'assistant',
            content: response.summary || 'Applied requested changes to the codebase',
            metadata: {
              filesModified: response.files?.length || 0,
              isConversational,
            },
          });

          // Update job with result in database
          job.status = 'completed';
          job.result = {
            files: isConversational ? [] : updatedFiles, // Empty array for conversational responses
            summary: response.summary || (isConversational ? 'Chat response' : 'Applied requested changes to the codebase'),
          };
          job.updatedAt = new Date();

          await supabase
            .from('chat_jobs')
            .update({
              status: 'completed',
              result: job.result,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Only reset deployment status if there were file changes
          if (!isConversational) {
            console.log(`[ChatQueue] Resetting deployment status for generation ${job.generationId}`);
            await supabase
              .from('generations')
              .update({
                deployment_status: 'pending',
                files: updatedFiles,
              })
              .eq('id', job.generationId);
          } else {
            console.log(`[ChatQueue] Conversational response only, no file changes`);
          }

          console.log(`[ChatQueue] Chat job ${job.id} completed successfully`);
          return;
        }
      } else {
        console.log(`[ChatQueue] Specialist agent forced: ${specialistAgent}, skipping ChatAgent routing`);
      }
      
      // Handle specialist agent routing
      if (needsSpecialist && specialistAgent) {
        // Normalize agent names to handle variations
        const agentNameMap: Record<string, string> = {
          'DocsWeaver': 'DocWeaver',  // Fix common typo
          'DocWeaverAgent': 'DocWeaver',
          'CodeGeneratorAgent': 'CodeGenerator',  // Legacy support
          'CodeGenerator': 'CodeGenerator',  // Map to SimpleCoder/ComplexCoder in workflow
          'SimpleCoderAgent': 'SimpleCoder',
          'ComplexCoderAgent': 'ComplexCoder',
          'CodeModificationAgent': 'CodeModification',
          'TestCrafterAgent': 'TestCrafter',
          'SecuritySentinelAgent': 'SecuritySentinel',
          'PerformanceProfilerAgent': 'PerformanceProfiler',
          'BugHunterAgent': 'BugHunter',
        };
        
        if (agentNameMap[specialistAgent]) {
          console.log(`[ChatQueue] Normalizing agent name: ${specialistAgent} → ${agentNameMap[specialistAgent]}`);
          specialistAgent = agentNameMap[specialistAgent];
        }
        if (agentNameMap[specialistAgent]) {
          console.log(`[ChatQueue] Normalizing agent name: ${specialistAgent} → ${agentNameMap[specialistAgent]}`);
          specialistAgent = agentNameMap[specialistAgent];
        }
        
        console.log(`[ChatQueue] Routing to specialist: ${specialistAgent}`);
        await this.emitProgress(job.id, 'ChatAgent', 'completed', `Routing your request to ${specialistAgent}...`);
        
        // Handle GitHubAgent separately (doesn't use workflows)
        if (specialistAgent === 'GitHubAgent') {
          if (!job.githubContext) {
            throw new Error('GitHub operations require GitHub authentication. Please configure your GitHub token in Settings.');
          }
          
          await this.emitProgress(job.id, 'GitHubAgent', 'started', 'Handling GitHub operation...');
          
          // Build context with conversation history for GitHubAgent
          const { contextMessage } = await ChatMemoryManager.buildContext(
            job.generationId,
            job.message,
            job.currentFiles,
            job.language,
            job.imageUrls
          );
          
          const { GitHubAgent } = await import('../agents/specialized/GitHubAgent');
          const { runner } = await GitHubAgent(job.githubContext);
          
          const response = await safeAgentCall(runner, contextMessage, {
            maxRetries: 3,
            retryDelay: 1000,
            context: 'ChatQueue/GitHubAgent'
          }) as any;
          
          // Store response in memory
          await ChatMemoryManager.storeMessage({
            generationId: job.generationId,
            role: 'assistant',
            content: response.summary || 'GitHub operation completed',
            metadata: {
              filesModified: response.filesModified || 0,
              prCreated: response.prCreated || false,
              branchCreated: response.branchCreated || false,
            },
          });
          
          // Update job as completed
          job.status = 'completed';
          job.result = {
            files: job.currentFiles, // GitHub operations don't change local files
            summary: response.summary,
          };
          job.updatedAt = new Date();
          
          await supabase
            .from('chat_jobs')
            .update({
              status: 'completed',
              result: job.result,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
          
          console.log(`[ChatQueue] GitHubAgent completed for job ${job.id}`);
          return;
        }
        
        // Determine which workflow to use based on the agent
        const reviewAgents = ['BugHunter', 'SecuritySentinel', 'PerformanceProfiler'];
        const isReviewWorkflow = reviewAgents.includes(specialistAgent);
        
        // Build context with conversation history for specialist agents
        const { contextMessage } = await ChatMemoryManager.buildContext(
          job.generationId,
          job.message,
          job.currentFiles,
          job.language,
          job.imageUrls
        );
        
        console.log(`[ChatQueue] Built conversation context for ${specialistAgent}`);
        
        let workflowResult: any;
        
        if (isReviewWorkflow) {
          // Route to ReviewWorkflow for code analysis
          await this.emitProgress(job.id, specialistAgent, 'started', `Starting code review process...`);
          
          const { ReviewWorkflow } = await import('../workflows/ReviewWorkflow');
          const workflow = new ReviewWorkflow({
            githubContext: job.githubContext, // Pass GitHub context to ReviewWorkflow
          });
          
          // Map specialist agent to review options
          const reviewOptions = {
            checkBugs: specialistAgent === 'BugHunter',
            checkSecurity: specialistAgent === 'SecuritySentinel',
            checkPerformance: specialistAgent === 'PerformanceProfiler',
            checkStyle: false,
          };
          
          workflowResult = await workflow.run({
            code: job.currentFiles,
            language: job.language, // Optional - will auto-detect if undefined
            options: reviewOptions,
          });
        } else {
          // Route to GenerateWorkflow for code generation/modification
          const { GenerateWorkflow } = await import('../workflows/GenerateWorkflow');
          const workflow = new GenerateWorkflow({
            githubContext: job.githubContext,
            jobId: job.id // Pass job ID for progress tracking
          });
          
          workflowResult = await workflow.run({
            prompt: contextMessage, // Use context message instead of raw message
            projectContext: '',
            ...(job.language && { targetLanguage: job.language }), // Only include if provided, let workflow auto-detect otherwise
            complexity: 'moderate',
            agents: [specialistAgent],
            imageUrls: job.imageUrls,
            currentFiles: job.currentFiles || [], // Pass existing files for doc-only requests
            errorContext: job.errorContext, // Pass error context for better fixes
          });
        }
        
        // Format the result based on workflow type
        let jobResult: { files: any[]; summary: string; agent?: string; suggestions?: string[] };
        
        if (isReviewWorkflow) {
          // ReviewWorkflow returns { findings, summary, agentsInvolved, overallScore }
          const reviewSummary = workflowResult.summary || 'Code review completed';
          const findingsCount = workflowResult.findings?.length || 0;
          const criticalCount = workflowResult.findings?.filter((f: any) => f.severity === 'critical').length || 0;
          
          const detailedSummary = `${reviewSummary}\n\nFound ${findingsCount} issue(s)${criticalCount > 0 ? ` (${criticalCount} critical)` : ''}`;
          
          jobResult = {
            files: [], // Review doesn't modify files
            summary: detailedSummary,
            agent: specialistAgent,
            suggestions: workflowResult.findings?.slice(0, 3).map((f: any) => 
              `${f.severity}: ${f.message}${f.file ? ` in ${f.file}` : ''}`
            ),
          };
        } else {
          // GenerateWorkflow returns { files, summary, ... }
          jobResult = {
            files: workflowResult.files || [],
            summary: workflowResult.summary || 'Request completed successfully',
            agent: specialistAgent,
          };
        }
        
        // Store the workflow result
        job.status = 'completed';
        job.result = jobResult;
        job.updatedAt = new Date();
        
        await supabase
          .from('chat_jobs')
          .update({
            status: 'completed',
            result: job.result,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        
        // Update generation with new files (only if files were generated)
        if (!isReviewWorkflow && workflowResult.files && workflowResult.files.length > 0) {
          await supabase
            .from('generations')
            .update({
              deployment_status: 'pending',
              files: workflowResult.files,
              target_language: workflowResult.language, // Update detected language
            })
            .eq('id', job.generationId);
        }
        
        // Store assistant response in memory for specialist agents
        await ChatMemoryManager.storeMessage({
          generationId: job.generationId,
          role: 'assistant',
          content: jobResult.summary,
          metadata: {
            agent: specialistAgent,
            filesModified: jobResult.files.length,
            isReviewWorkflow,
            suggestions: jobResult.suggestions,
          },
        });
        
        console.log(`[ChatQueue] Chat job ${job.id} completed via ${isReviewWorkflow ? 'ReviewWorkflow' : 'GenerateWorkflow'} (${specialistAgent})`);
        return;
      }

    } catch (error: any) {
      console.error(`[ChatQueue] Chat job ${job.id} failed:`, error);
      
      job.status = 'error';
      job.error = error.message || 'Chat processing failed';
      job.updatedAt = new Date();

      await supabase
        .from('chat_jobs')
        .update({
          status: 'error',
          error: job.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }
}

export const chatQueue = new ChatQueueManager();
