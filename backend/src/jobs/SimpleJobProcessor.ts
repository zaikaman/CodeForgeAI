import { supabase } from '../storage/SupabaseClient';
import { chatQueue } from '../services/ChatQueue';
import { randomUUID } from 'crypto';

interface BackgroundJob {
  id: string;
  user_id: string;
  session_id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  user_message: string;
  context: any;
  progress: number;
  result?: any;
  error?: string;
  logs?: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Simple background job processor
 * - Polls database for pending jobs
 * - Processes one job at a time
 * - Updates progress in database
 * - No Redis, no Bull queue complexity
 */
export class SimpleJobProcessor {
  private isProcessing = false;
  private pollInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start polling for jobs every 2 seconds
   */
  start() {
    console.log('🚀 SimpleJobProcessor started');
    
    // Process immediately
    this.processNextJob();
    
    // Then poll every 2 seconds
    this.pollInterval = setInterval(() => {
      this.processNextJob();
    }, 2000);
  }
  
  /**
   * Stop polling
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('🛑 SimpleJobProcessor stopped');
  }
  
  /**
   * Process the next pending job
   */
  private async processNextJob() {
    // Skip if already processing
    if (this.isProcessing) {
      return;
    }
    
    try {
      this.isProcessing = true;
      
      // Get oldest pending job
      const { data: jobs, error } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (error) {
        console.error('❌ Error fetching jobs:', error);
        return;
      }
      
      if (!jobs || jobs.length === 0) {
        // No pending jobs
        return;
      }
      
      const job = jobs[0] as BackgroundJob;
      
      console.log(`\n🚀 Processing job ${job.id}...`);
      console.log(`   User: ${job.user_id}`);
      console.log(`   Message: ${job.user_message.substring(0, 100)}...`);
      
      await this.processJob(job);
      
    } catch (error: any) {
      console.error('❌ Error in processNextJob:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Process a single job using ChatQueue (same logic as normal chat)
   */
  private async processJob(job: BackgroundJob) {
    const startTime = new Date();
    const logs: string[] = [];
    
    try {
      // Update to processing
      await this.updateJob(job.id, {
        status: 'processing',
        started_at: startTime.toISOString(),
        progress: 10,
      });
      
      logs.push(`[${new Date().toISOString()}] Starting agent task`);
      logs.push(`User: ${job.user_id}, Session: ${job.session_id}`);
      logs.push(`Message: ${job.user_message}`);
      
      // Use ChatQueue to process (same as normal chat)
      // This ensures full routing through ChatAgent → GitHubAgent/SimpleCoder/etc.
      await this.updateJob(job.id, { progress: 20, logs });
      logs.push(`[${new Date().toISOString()}] Submitting to ChatQueue...`);
      
      // Create a NEW chat job ID (can't reuse background job ID due to unique constraint)
      const chatJobId = randomUUID();
      
      await chatQueue.enqueue({
        id: chatJobId,
        generationId: job.session_id,
        userId: job.user_id,
        message: job.user_message,
        currentFiles: job.context?.fileContents || [],
        language: job.context?.language || 'typescript',
        imageUrls: job.context?.imageUrls || [],
        githubContext: job.context?.githubContext,
      });
      
      await this.updateJob(job.id, { progress: 30, logs });
      logs.push(`[${new Date().toISOString()}] Chat job ${chatJobId} created, waiting for completion...`);
      
      // Poll chat job status until completed
      let chatJobCompleted = false;
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts x 2s = 2 minutes max
      
      while (!chatJobCompleted && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        attempts++;
        
        const chatJob = await chatQueue.getJob(chatJobId);
        
        if (chatJob) {
          // Update progress based on chat job progress
          const progress = Math.min(90, 30 + (attempts * 2)); // 30% → 90%
          await this.updateJob(job.id, { progress, logs });
          
          if (chatJob.status === 'completed') {
            chatJobCompleted = true;
            logs.push(`[${new Date().toISOString()}] Chat job completed successfully`);
            
            // Complete background job
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            
            logs.push(`[${new Date().toISOString()}] Task completed successfully`);
            logs.push(`Duration: ${(duration / 1000).toFixed(2)}s`);
            
            await this.updateJob(job.id, {
              status: 'completed',
              progress: 100,
              result: chatJob.result,
              logs,
              completed_at: endTime.toISOString(),
            });
            
            console.log(`✅ Job ${job.id} completed successfully`);
            console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
            
          } else if (chatJob.status === 'error') {
            throw new Error(chatJob.error || 'Chat job failed');
          }
        }
      }
      
      if (!chatJobCompleted) {
        throw new Error('Chat job timeout after 2 minutes');
      }
      
    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      logs.push(`[${new Date().toISOString()}] ERROR: ${error.message}`);
      logs.push(`Stack: ${error.stack}`);
      
      await this.updateJob(job.id, {
        status: 'failed',
        error: error.message,
        logs,
        completed_at: endTime.toISOString(),
      });
      
      console.error(`❌ Job ${job.id} failed:`, error.message);
      console.error(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    }
  }
  
  /**
   * Update job in database
   */
  private async updateJob(jobId: string, updates: Partial<BackgroundJob>) {
    const { error } = await supabase
      .from('background_jobs')
      .update(updates)
      .eq('id', jobId);
    
    if (error) {
      console.error(`❌ Error updating job ${jobId}:`, error);
    }
  }
}

// Singleton instance
let processorInstance: SimpleJobProcessor | null = null;

export function startJobProcessor() {
  if (!processorInstance) {
    processorInstance = new SimpleJobProcessor();
    processorInstance.start();
  }
  return processorInstance;
}

export function stopJobProcessor() {
  if (processorInstance) {
    processorInstance.stop();
    processorInstance = null;
  }
}
