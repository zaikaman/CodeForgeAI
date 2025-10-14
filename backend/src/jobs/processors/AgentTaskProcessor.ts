import { Job } from 'bull';
import { AgentTaskJobData, JobResult } from '../types';
import { agentRouter } from '../../services/AgentRouterService';
import { io } from '../../api/server';

/**
 * Process agent tasks in the background
 */
export async function processAgentTask(job: Job<AgentTaskJobData>): Promise<JobResult> {
  const startTime = new Date();
  const logs: string[] = [];
  
  try {
    const { userId, sessionId, userMessage, agentType, context } = job.data;
    
    logs.push(`[${new Date().toISOString()}] Starting agent task`);
    logs.push(`User: ${userId}, Session: ${sessionId}`);
    logs.push(`Message: ${userMessage}`);
    
    // Update progress: 10%
    await job.progress(10);
    emitJobUpdate(job, 'active', 10, logs);
    
    // Step 1: Route the request to appropriate workflow
    logs.push(`[${new Date().toISOString()}] Analyzing request and routing to agent...`);
    await job.progress(20);
    emitJobUpdate(job, 'active', 20, logs);
    
    const routeRequest = {
      message: userMessage,
      context: context ? JSON.stringify(context) : undefined,
      currentFiles: context?.files || [],
    };
    
    const route = await agentRouter.route(routeRequest);
    logs.push(`[${new Date().toISOString()}] Routed to workflow: ${route.workflow}`);
    logs.push(`Selected agents: ${route.selectedAgents.join(', ')}`);
    logs.push(`Reasoning: ${route.reasoning}`);
    
    await job.progress(40);
    emitJobUpdate(job, 'active', 40, logs);
    
    // Step 2: Execute the workflow
    logs.push(`[${new Date().toISOString()}] Executing ${route.workflow} workflow...`);
    await job.progress(50);
    emitJobUpdate(job, 'active', 50, logs);
    
    const result = await agentRouter.executeWorkflow(route, routeRequest, {
      agentType,
      ...context,
    });
    
    logs.push(`[${new Date().toISOString()}] Workflow execution completed`);
    await job.progress(90);
    emitJobUpdate(job, 'active', 90, logs);
    
    // Step 3: Format and return result
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    logs.push(`[${new Date().toISOString()}] Task completed successfully`);
    logs.push(`Duration: ${(duration / 1000).toFixed(2)}s`);
    
    await job.progress(100);
    
    const jobResult: JobResult = {
      success: true,
      result: {
        workflow: route.workflow,
        agents: route.selectedAgents,
        output: result,
        suggestions: route.suggestions,
      },
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
