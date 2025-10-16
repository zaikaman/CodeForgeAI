import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @deprecated Use `useRealtimeJob` instead for better performance with WebSocket-based real-time updates.
 * This hook is kept for fallback purposes only when WebSocket connection fails.
 * 
 * useChatJobPolling - Legacy polling-based job status tracker
 * 
 * ⚠️ WARNING: This hook uses polling which can:
 * - Increase server load
 * - Cause higher latency
 * - Consume more bandwidth
 * 
 * Prefer using `useRealtimeJob` hook which provides:
 * - Real-time updates via WebSocket
 * - Lower server load
 * - Better user experience
 * - Automatic fallback to this hook if WebSocket fails
 */

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
  const hasCompletedRef = useRef(false); // Track if onComplete has been called
  const hasErroredRef = useRef(false); // Track if onError has been called

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
    setAttempts(0);
    // Don't reset completion flags here - they should persist for the jobId
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
        if (!hasCompletedRef.current) {
          console.log('[useChatJobPolling] Job completed successfully');
          hasCompletedRef.current = true; // Mark as completed to prevent duplicate calls
          stopPolling();
          
          const result = {
            files: chatJobData.result?.files,
            summary: chatJobData.result?.summary || 'Request processed successfully',
            agent: chatJobData.result?.agent || 'ChatAgent',
            suggestions: chatJobData.result?.suggestions || [],
          };
          
          onComplete?.(result);
        }
        return;
      }

      // Check if job failed
      if (status === 'error') {
        if (!hasErroredRef.current) {
          console.error('[useChatJobPolling] Job failed:', chatJobData.error);
          hasErroredRef.current = true; // Mark as errored to prevent duplicate calls
          stopPolling();
          onError?.(chatJobData.error || 'Chat job failed');
        }
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

    // Prevent starting a new poll if already polling the same job
    if (isPolling && pollingRef.current) {
      console.log(`[useChatJobPolling] Already polling job: ${jobId}`);
      return;
    }

    console.warn('⚠️ [useChatJobPolling] Using deprecated polling hook. Consider using useRealtimeJob for better performance.');
    console.log(`[useChatJobPolling] Starting polling for job: ${jobId}`);
    setIsPolling(true);
    attemptsRef.current = 0;
    setAttempts(0);
    hasCompletedRef.current = false; // Reset completion flag for new job
    hasErroredRef.current = false; // Reset error flag for new job

    // Poll immediately
    pollJob();

    // Set up interval
    pollingRef.current = setInterval(pollJob, pollInterval);

    // Cleanup on unmount or when jobId/enabled changes
    return () => {
      stopPolling();
    };
  }, [jobId, enabled, pollInterval]);

  return {
    isPolling,
    attempts,
    jobStatus,
    stopPolling,
    pollNow: pollJob,
  };
};
