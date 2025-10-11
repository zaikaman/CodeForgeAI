import { GenerateWorkflow } from '../workflows/GenerateWorkflow';
import { supabase } from '../storage/SupabaseClient';
import { PreviewServiceWithRetry } from './preview/PreviewServiceWithRetry';

interface GenerationJob {
  id: string;
  prompt: string;
  projectContext?: string;
  targetLanguage: string;
  complexity: 'simple' | 'moderate' | 'complex';
  agents: string[];
  imageUrls?: string[];
  autoPreview?: boolean; // Enable automatic preview deployment
}

class GenerationQueue {
  private processing = new Set<string>();
  private queue: GenerationJob[] = [];
  private isProcessing = false;

  async enqueue(job: GenerationJob): Promise<void> {
    console.log(`[GenerationQueue] Enqueueing job ${job.id}`);
    this.queue.push(job);
    
    // Update status to pending in database
    await supabase
      .from('generations')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

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

  private async processJob(job: GenerationJob): Promise<void> {
    const { id, prompt, projectContext, targetLanguage, complexity, agents, imageUrls } = job;

    if (this.processing.has(id)) {
      console.log(`[GenerationQueue] Job ${id} is already being processed`);
      return;
    }

    this.processing.add(id);

    try {
      console.log(`[GenerationQueue] Processing job ${id}`);

      // Update status to processing
      await supabase
        .from('generations')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // Run the generation workflow
      const generateWorkflow = new GenerateWorkflow();
      const result = await generateWorkflow.run({
        prompt,
        projectContext,
        targetLanguage,
        complexity,
        agents,
        imageUrls,
      });

      // Update with results
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          files: result.files,
          agent_thoughts: result.agentThoughts,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      console.log(`[GenerationQueue] Job ${id} completed successfully`);

      // Auto-deploy to Fly.io if enabled and FLY_API_TOKEN is set
      if (job.autoPreview !== false && process.env.FLY_API_TOKEN && result.files && result.files.length > 0) {
        console.log(`[GenerationQueue] Auto-deploying preview for job ${id}...`);
        
        // Set deployment status to 'deploying' BEFORE starting deployment
        await supabase
          .from('generations')
          .update({ 
            deployment_status: 'deploying',
            deployment_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        try {
          const previewService = new PreviewServiceWithRetry(3);
          const previewResult = await previewService.generatePreviewWithRetry(
            id,
            result.files,
            3 // max retries
          );

          if (previewResult.success && previewResult.previewUrl) {
            // Update preview_url and deployment_status in database
            await supabase
              .from('generations')
              .update({ 
                preview_url: previewResult.previewUrl,
                deployment_status: 'deployed',
                deployment_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', id);
            
            console.log(`[GenerationQueue] ✓ Preview deployed successfully: ${previewResult.previewUrl}`);
          } else {
            // Update deployment_status to 'failed'
            await supabase
              .from('generations')
              .update({ 
                deployment_status: 'failed',
                deployment_error: previewResult.error || 'Unknown deployment error',
                deployment_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', id);
            
            console.warn(`[GenerationQueue] ✗ Preview deployment failed:`, previewResult.error);
          }
        } catch (previewError: any) {
          console.error(`[GenerationQueue] Preview deployment error:`, previewError.message);
          
          // Update deployment_status to 'failed'
          await supabase
            .from('generations')
            .update({ 
              deployment_status: 'failed',
              deployment_error: previewError.message,
              deployment_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          // Don't fail the job if preview deployment fails
        }
      } else if (!process.env.FLY_API_TOKEN) {
        console.log(`[GenerationQueue] Skipping auto-preview: FLY_API_TOKEN not configured`);
      } else if (job.autoPreview === false) {
        console.log(`[GenerationQueue] Skipping auto-preview: disabled for this job`);
      }
    } catch (error: any) {
      console.error(`[GenerationQueue] Job ${id} failed:`, error);

      // Update with error
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error: error.message || 'Unknown error occurred',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } finally {
      this.processing.delete(id);
    }
  }

  getStatus(id: string): 'processing' | 'queued' | 'unknown' {
    if (this.processing.has(id)) return 'processing';
    if (this.queue.some(job => job.id === id)) return 'queued';
    return 'unknown';
  }
}

// Export singleton instance
export const generationQueue = new GenerationQueue();
