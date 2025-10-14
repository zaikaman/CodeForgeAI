import { supabase } from '../storage/SupabaseClient';
import { ChatAgent } from '../agents/specialized/ChatAgent';

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
   * Process a single job
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
      
      // Initialize ChatAgent
      await this.updateJob(job.id, { progress: 20, logs });
      logs.push(`[${new Date().toISOString()}] Initializing ChatAgent...`);
      
      const githubContext = job.context?.githubContext;
      const chatAgent = await ChatAgent(githubContext);
      const { runner } = chatAgent;
      
      // Prepare context
      await this.updateJob(job.id, { progress: 30, logs });
      logs.push(`[${new Date().toISOString()}] Processing request with ChatAgent...`);
      
      const contextParts: string[] = [];
      
      if (job.context?.fileContents?.length > 0) {
        contextParts.push(`\n=== CURRENT CODEBASE ===`);
        job.context.fileContents.forEach((file: any) => {
          contextParts.push(`\nFile: ${file.path}`);
          contextParts.push(`\`\`\`\n${file.content}\n\`\`\``);
        });
        contextParts.push(`\n=== END CODEBASE ===\n`);
      }
      
      if (job.context?.githubContext) {
        contextParts.push(`\n=== GITHUB CONTEXT ===`);
        contextParts.push(`Username: ${job.context.githubContext.username}`);
        contextParts.push(`Token: Available`);
        if (job.context.githubContext.email) {
          contextParts.push(`Email: ${job.context.githubContext.email}`);
        }
        contextParts.push(`=== END GITHUB CONTEXT ===\n`);
      }
      
      const fullMessage = job.user_message + (contextParts.length > 0 ? '\n' + contextParts.join('\n') : '');
      
      // Execute ChatAgent
      await this.updateJob(job.id, { progress: 50, logs });
      logs.push(`[${new Date().toISOString()}] Executing ChatAgent...`);
      
      const response = await runner.ask(fullMessage);
      
      await this.updateJob(job.id, { progress: 90, logs });
      logs.push(`[${new Date().toISOString()}] ChatAgent execution completed`);
      
      // Complete job
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      logs.push(`[${new Date().toISOString()}] Task completed successfully`);
      logs.push(`Duration: ${(duration / 1000).toFixed(2)}s`);
      
      await this.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        result: response,
        logs,
        completed_at: endTime.toISOString(),
      });
      
      console.log(`✅ Job ${job.id} completed successfully`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      
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
