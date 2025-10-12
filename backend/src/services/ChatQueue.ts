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
      
      // Merge modified/new files with existing files
      let updatedFiles: Array<{ path: string; content: string }> = [...job.currentFiles];
      
      if (response.files && Array.isArray(response.files) && response.files.length > 0) {
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
        },
      });

      // Update job with result in database
      job.status = 'completed';
      job.result = {
        files: updatedFiles,
        summary: response.summary || 'Applied requested changes to the codebase',
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

      // Reset deployment status since code changed
      // This signals frontend that a new deployment is needed
      console.log(`[ChatQueue] Resetting deployment status for generation ${job.generationId}`);
      await supabase
        .from('generations')
        .update({
          deployment_status: 'pending',
          files: updatedFiles,
        })
        .eq('id', job.generationId);

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
