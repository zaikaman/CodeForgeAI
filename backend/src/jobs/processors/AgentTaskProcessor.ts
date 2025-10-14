import { Job } from 'bull';
import { AgentTaskJobData, JobResult } from '../types';
import { io } from '../../api/server';
import { ChatAgent } from '../../agents/specialized/ChatAgent';

/**
 * Process agent tasks in the background using ChatAgent
 */
export async function processAgentTask(job: Job<AgentTaskJobData>): Promise<JobResult> {
  const startTime = new Date();
  const logs: string[] = [];
  
  try {
    const { userId, sessionId, userMessage, context } = job.data;
    
    logs.push(`[${new Date().toISOString()}] Starting agent task`);
    logs.push(`User: ${userId}, Session: ${sessionId}`);
    logs.push(`Message: ${userMessage}`);
    
    // Update progress: 10%
    await job.progress(10);
    emitJobUpdate(job, 'active', 10, logs);
    
    // Step 1: Initialize ChatAgent with GitHub context if available
    logs.push(`[${new Date().toISOString()}] Initializing ChatAgent...`);
    await job.progress(20);
    emitJobUpdate(job, 'active', 20, logs);
    
    const githubContext = context?.githubContext;
    const chatAgent = await ChatAgent(githubContext);
    const { runner } = chatAgent;
    
    // Step 2: Prepare context for ChatAgent
    logs.push(`[${new Date().toISOString()}] Processing request with ChatAgent...`);
    await job.progress(30);
    emitJobUpdate(job, 'active', 30, logs);
    
    // Build context string
    const contextParts: string[] = [];
    
    if (context?.fileContents && context.fileContents.length > 0) {
      contextParts.push(`\n=== CURRENT CODEBASE ===`);
      context.fileContents.forEach((file: any) => {
        contextParts.push(`\nFile: ${file.path}`);
        contextParts.push(`\`\`\`\n${file.content}\n\`\`\``);
      });
      contextParts.push(`\n=== END CODEBASE ===\n`);
    }
    
    if (context?.githubContext) {
      contextParts.push(`\n=== GITHUB CONTEXT ===`);
      contextParts.push(`Username: ${context.githubContext.username}`);
      contextParts.push(`Token: Available`);
      if (context.githubContext.email) {
        contextParts.push(`Email: ${context.githubContext.email}`);
      }
      contextParts.push(`=== END GITHUB CONTEXT ===\n`);
    }
    
    const fullMessage = userMessage + (contextParts.length > 0 ? '\n' + contextParts.join('\n') : '');
    
    // Step 3: Call ChatAgent
    logs.push(`[${new Date().toISOString()}] Executing ChatAgent...`);
    await job.progress(50);
    emitJobUpdate(job, 'active', 50, logs);
    
    const response = await runner.ask(fullMessage);
    
    logs.push(`[${new Date().toISOString()}] ChatAgent execution completed`);
    await job.progress(90);
    emitJobUpdate(job, 'active', 90, logs);
    
    // Step 4: Format and return result
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    logs.push(`[${new Date().toISOString()}] Task completed successfully`);
    logs.push(`Duration: ${(duration / 1000).toFixed(2)}s`);
    
    await job.progress(100);
    
    const jobResult: JobResult = {
      success: true,
      result: response,
      logs,
      startTime,
      endTime,
      duration,
    };
    
    // Emit completion event
    emitJobUpdate(job, 'completed', 100, logs, jobResult);
    
    return jobResult;
    
  } catch (error: any) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    logs.push(`[${new Date().toISOString()}] ERROR: ${error.message}`);
    logs.push(`Stack: ${error.stack}`);
    
    const jobResult: JobResult = {
      success: false,
      error: error.message,
      logs,
      startTime,
      endTime,
      duration,
    };
    
    // Emit failure event
    emitJobUpdate(job, 'failed', job.progress() as number, logs, jobResult);
    
    throw error; // Re-throw to let Bull handle retry logic
  }
}

/**
 * Emit job status update via Socket.IO
 */
function emitJobUpdate(
  job: Job<AgentTaskJobData>,
  status: string,
  progress: number,
  logs: string[],
  result?: JobResult
) {
  const { userId, sessionId } = job.data;
  
  // Emit to user's room
  io.to(`user:${userId}`).emit('job:update', {
    jobId: job.id,
    sessionId,
    status,
    progress,
    logs: logs.slice(-10), // Only send last 10 log entries
    result,
    timestamp: new Date().toISOString(),
  });
  
  // Also emit to session room
  io.to(`session:${sessionId}`).emit('job:update', {
    jobId: job.id,
    status,
    progress,
    logs: logs.slice(-10),
    result,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Job event handlers
 */
export function setupJobEventHandlers(queue: any) {
  queue.on('completed', (job: Job<AgentTaskJobData>, result: JobResult) => {
    console.log(`✅ Job ${job.id} completed successfully`);
    console.log(`   User: ${job.data.userId}`);
    console.log(`   Duration: ${result.duration}ms`);
  });
  
  queue.on('failed', (job: Job<AgentTaskJobData>, error: Error) => {
    console.error(`❌ Job ${job.id} failed:`, error.message);
    console.error(`   User: ${job.data.userId}`);
    console.error(`   Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
  });
  
  queue.on('progress', (job: Job<AgentTaskJobData>, progress: number) => {
    console.log(`⏳ Job ${job.id} progress: ${progress}%`);
  });
  
  queue.on('stalled', (job: Job<AgentTaskJobData>) => {
    console.warn(`⚠️  Job ${job.id} stalled`);
  });
}
