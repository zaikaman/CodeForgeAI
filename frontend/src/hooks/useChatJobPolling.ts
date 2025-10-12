import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface ChatJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    files?: Array<{ path: string; content: string }>;
    summary?: string;
    agent?: string;
    suggestions?: string[];
  };
  error?: string;
  progressMessages?: Array<{
    timestamp: string;
    agent: string;
    status: string;
    message: string;
  }>;
}

export interface UseChatJobPollingOptions {
  jobId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  maxAttempts?: number;
  onStatusChange?: (status: string) => void;
  onProgressUpdate?: (messages: any[]) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useChatJobPolling = ({
  jobId,
  enabled = true,
  pollInterval = 1000,
  maxAttempts = 120,
  onStatusChange,
  onProgressUpdate,
  onComplete,
  onError,
}: UseChatJobPollingOptions) => {
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [jobStatus, setJobStatus] = useState<ChatJobStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
    setAttempts(0);
  }, []);

  const pollJob = useCallback(async () => {
    if (!jobId || !enabled) {
      return;
    }

    try {
      // Poll directly from Supabase database
      const { data: chatJobData, error: dbError } = await supabase
        .from('chat_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (dbError) {
        console.error('[useChatJobPolling] Database error:', dbError);
        
        // If job not found and we've tried a few times, stop polling
        if (dbError.code === 'PGRST116' && attemptsRef.current > 5) {
          stopPolling();
          onError?.('Chat job not found');
        }
        return;
      }

      if (!chatJobData) {
        console.warn('[useChatJobPolling] No data returned for job:', jobId);
        return;
      }

      const status = chatJobData.status;
      
      // Update job status state
      setJobStatus({
        id: chatJobData.id,
        status,
        result: chatJobData.result,
        error: chatJobData.error,
        progressMessages: chatJobData.progress_messages || [],
      });

      // Notify callbacks
      onStatusChange?.(status);
      
      if (chatJobData.progress_messages && chatJobData.progress_messages.length > 0) {
        onProgressUpdate?.(chatJobData.progress_messages);
      }

      console.log(`[useChatJobPolling] Job ${jobId} status: ${status} (${attemptsRef.current}/${maxAttempts})`);

      // Check if job completed
      if (status === 'completed') {
        console.log('[useChatJobPolling] Job completed successfully');
        stopPolling();
        
        const result = {
          files: chatJobData.result?.files,
          summary: chatJobData.result?.summary || 'Request processed successfully',
          agent: chatJobData.result?.agent || 'ChatAgent',
          suggestions: chatJobData.result?.suggestions || [],
        };
        
        onComplete?.(result);
        return;
      }

      // Check if job failed
      if (status === 'error') {
        console.error('[useChatJobPolling] Job failed:', chatJobData.error);
        stopPolling();
        onError?.(chatJobData.error || 'Chat job failed');
        return;
      }

      // Increment attempts
      attemptsRef.current++;
      setAttempts(attemptsRef.current);

      // Check if max attempts reached
      if (attemptsRef.current >= maxAttempts) {
        console.error('[useChatJobPolling] Max attempts reached');
        stopPolling();
        onError?.('Request timed out. Please try again.');
        return;
      }
    } catch (error: any) {
      console.error('[useChatJobPolling] Polling error:', error);
      
      // Don't stop polling on transient errors, just log them
      if (attemptsRef.current > maxAttempts / 2) {
        stopPolling();
        onError?.(error.message || 'Failed to poll chat job');
      }
    }
  }, [jobId, enabled, maxAttempts, onStatusChange, onProgressUpdate, onComplete, onError, stopPolling]);

  // Start polling when jobId changes or enabled changes
  useEffect(() => {
    if (!jobId || !enabled) {
      stopPolling();
      return;
    }

    console.log(`[useChatJobPolling] Starting polling for job: ${jobId}`);
    setIsPolling(true);
    attemptsRef.current = 0;
    setAttempts(0);

    // Poll immediately
    pollJob();

    // Set up interval
    pollingRef.current = setInterval(pollJob, pollInterval);

    // Cleanup on unmount or when jobId/enabled changes
    return () => {
      stopPolling();
    };
  }, [jobId, enabled, pollInterval, pollJob, stopPolling]);

  return {
    isPolling,
    attempts,
    jobStatus,
    stopPolling,
    pollNow: pollJob,
  };
};
