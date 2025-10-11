/**
 * ChatQueue - Manages chat requests as background jobs to avoid Heroku 30s timeout
 * Similar to GenerationQueue pattern
 */

import { ChatAgent } from '../agents/specialized/ChatAgent';
import { ChatMemoryManager } from './ChatMemoryManager';

interface ChatJob {
  id: string;
  generationId: string;
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
  private jobs = new Map<string, ChatJob>();
  private queue: ChatJob[] = [];
  private isProcessing = false;

  /**
   * Enqueue a chat request
   */
  async enqueue(params: {
    id: string;
    generationId: string;
    message: string;
    currentFiles: Array<{ path: string; content: string }>;
    language: string;
    imageUrls?: string[];
  }): Promise<void> {
    const job: ChatJob = {
      id: params.id,
      generationId: params.generationId,
      message: params.message,
      currentFiles: params.currentFiles,
      language: params.language,
      imageUrls: params.imageUrls,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(params.id, job);
    this.queue.push(job);
    
    console.log(`[ChatQueue] Enqueued chat job ${params.id} for generation ${params.generationId}`);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Get job by ID
   */
  getJob(id: string): ChatJob | undefined {
    return this.jobs.get(id);
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
      // Update status
      job.status = 'processing';
      job.updatedAt = new Date();

      // Build context with conversation history
      const { contextMessage, totalTokens } = await ChatMemoryManager.buildContext(
        job.generationId,
        job.message,
        job.currentFiles,
        job.language,
        job.imageUrls
      );

      console.log(`[ChatQueue] Chat context built: ${totalTokens} estimated tokens`);

      // Use ChatAgent
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

      let response = await runner.ask(chatMessage) as any;
      
      console.log(`[ChatQueue] Raw response type:`, typeof response);
      console.log(`[ChatQueue] Response has files:`, response?.files ? 'yes' : 'no');
      
      // Handle case where response might be a string (invalid JSON)
      if (typeof response === 'string') {
        try {
          console.log(`[ChatQueue] Response is string, attempting to parse...`);
          response = JSON.parse(response);
        } catch (parseError) {
          console.error(`[ChatQueue] Failed to parse string response:`, parseError);
          throw new Error('Agent returned invalid JSON response');
        }
      }
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        console.error(`[ChatQueue] Invalid response structure:`, response);
        throw new Error('Agent returned invalid response structure');
      }
      
      if (!response.files || !Array.isArray(response.files)) {
        console.error(`[ChatQueue] Response missing files array:`, response);
        throw new Error('Agent response missing files array');
      }
      
      // Validate and sanitize response files
      for (let i = 0; i < response.files.length; i++) {
        const file = response.files[i];
        
        if (!file.path || typeof file.path !== 'string') {
          console.error(`[ChatQueue] File ${i} missing valid path:`, file);
          throw new Error(`File ${i} missing valid path`);
        }
        
        if (typeof file.content !== 'string') {
          console.warn(`[ChatQueue] File ${file.path} has non-string content, converting...`);
          
          if (typeof file.content === 'object') {
            response.files[i].content = JSON.stringify(file.content, null, 2);
          } else {
            response.files[i].content = String(file.content);
          }
        } else {
          // Handle double-stringified content
          if (file.content.startsWith('"') && file.content.endsWith('"')) {
            try {
              const unescaped = JSON.parse(file.content);
              if (typeof unescaped === 'string') {
                response.files[i].content = unescaped;
                console.log(`[ChatQueue] Unescaped double-stringified content for ${file.path}`);
              }
            } catch (err) {
              console.warn(`[ChatQueue] Could not unescape content for ${file.path}, keeping as-is`);
            }
          }
          
          // Clean up escape sequences that might cause JSON issues
          // Replace literal \n with actual newlines if they exist
          if (response.files[i].content.includes('\\n')) {
            const originalLength = response.files[i].content.length;
            response.files[i].content = response.files[i].content.replace(/\\n/g, '\n');
            console.log(`[ChatQueue] Cleaned escape sequences in ${file.path} (${originalLength} -> ${response.files[i].content.length} chars)`);
          }
        }
      }
      
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

      // Update job with result
      job.status = 'completed';
      job.result = {
        files: updatedFiles,
        summary: response.summary || 'Applied requested changes to the codebase',
      };
      job.updatedAt = new Date();

      console.log(`[ChatQueue] Chat job ${job.id} completed successfully`);

      // Clean up job after 5 minutes
      setTimeout(() => {
        this.jobs.delete(job.id);
        console.log(`[ChatQueue] Cleaned up chat job ${job.id}`);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error(`[ChatQueue] Chat job ${job.id} failed:`, error);
      
      job.status = 'error';
      job.error = error.message || 'Chat processing failed';
      job.updatedAt = new Date();

      // Clean up failed job after 1 minute
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 60 * 1000);
    }
  }
}

export const chatQueue = new ChatQueueManager();
