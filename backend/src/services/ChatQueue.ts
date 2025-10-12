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
  language: string;
  imageUrls?: string[];
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
    language: string;
    imageUrls?: string[];
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
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    
    console.log(`[ChatQueue] Enqueued chat job ${params.id} for generation ${params.generationId}`);

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

      // Build context with conversation history
      const { contextMessage, totalTokens } = await ChatMemoryManager.buildContext(
        job.generationId,
        job.message,
        job.currentFiles,
        job.language,
        job.imageUrls
      );

      console.log(`[ChatQueue] Chat context built: ${totalTokens} estimated tokens`);

      // Use ChatAgent with improved error handling
      const { runner } = await ChatAgent();
      
      // Build the message with images if provided
      let chatMessage: any;
      
      if (job.imageUrls && job.imageUrls.length > 0) {
        // Download images and convert to base64
        const imageParts = await Promise.all(
          job.imageUrls.map(async (url) => {
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
      });
      
      // Check if specialist agent is needed
      if (response.needsSpecialist) {
        // Normalize agent names to handle variations
        const agentNameMap: Record<string, string> = {
          'DocsWeaver': 'DocWeaver',  // Fix common typo
          'DocWeaverAgent': 'DocWeaver',
          'CodeGeneratorAgent': 'CodeGenerator',
          'TestCrafterAgent': 'TestCrafter',
          'SecuritySentinelAgent': 'SecuritySentinel',
          'PerformanceProfilerAgent': 'PerformanceProfiler',
          'BugHunterAgent': 'BugHunter',
        };
        
        let specialistAgent = response.specialistAgent || 'CodeGenerator';
        if (agentNameMap[specialistAgent]) {
          console.log(`[ChatQueue] Normalizing agent name: ${specialistAgent} → ${agentNameMap[specialistAgent]}`);
          specialistAgent = agentNameMap[specialistAgent];
        }
        
        console.log(`[ChatQueue] Routing to specialist: ${specialistAgent}`);
        
        // Determine which workflow to use based on the agent
        const reviewAgents = ['BugHunter', 'SecuritySentinel', 'PerformanceProfiler'];
        const isReviewWorkflow = reviewAgents.includes(specialistAgent);
        
        let workflowResult: any;
        
        if (isReviewWorkflow) {
          // Route to ReviewWorkflow for code analysis
          const { ReviewWorkflow } = await import('../workflows/ReviewWorkflow');
          const workflow = new ReviewWorkflow();
          
          // Map specialist agent to review options
          const reviewOptions = {
            checkBugs: specialistAgent === 'BugHunter',
            checkSecurity: specialistAgent === 'SecuritySentinel',
            checkPerformance: specialistAgent === 'PerformanceProfiler',
            checkStyle: false,
          };
          
          workflowResult = await workflow.run({
            code: job.currentFiles,
            language: job.language,
            options: reviewOptions,
          });
        } else {
          // Route to GenerateWorkflow for code generation/modification
          const { GenerateWorkflow } = await import('../workflows/GenerateWorkflow');
          const workflow = new GenerateWorkflow();
          
          workflowResult = await workflow.run({
            prompt: job.message,
            projectContext: '',
            targetLanguage: job.language,
            complexity: 'moderate',
            agents: [specialistAgent],
            imageUrls: job.imageUrls,
            currentFiles: job.currentFiles || [], // Pass existing files for doc-only requests
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
