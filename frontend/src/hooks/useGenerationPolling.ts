import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @deprecated This polling-based hook should be replaced with WebSocket-based real-time tracking.
 * Consider creating `useRealtimeGeneration` hook similar to `useRealtimeJob`.
 * 
 * useGenerationPolling - Legacy polling-based generation status tracker
 * 
 * ⚠️ WARNING: This hook uses polling which can:
 * - Increase server load with frequent database queries
 * - Cause delays in status updates (polling interval dependent)
 * - Consume more bandwidth
 * 
 * TODO: Implement WebSocket-based `useRealtimeGeneration` hook that:
 * - Receives real-time updates via Socket.IO
 * - Eliminates polling overhead
 * - Provides instant status updates
 * - Uses this hook as automatic fallback
 */

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  files?: any;
  agentThoughts?: Array<{
    agent: string;
    role: string;
    content: string;
    timestamp: string;
    toolCalls?: any[];
  }>;
  error?: string;
  targetLanguage?: string;
  complexity?: string;
  previewUrl?: string;
  deploymentStatus?: string;
}

export interface UseGenerationPollingOptions {
  generationId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  maxAttempts?: number;
  onStatusChange?: (status: string) => void;
  onAgentThoughtsUpdate?: (thoughts: any[]) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useGenerationPolling = ({
  generationId,
  enabled = true,
  pollInterval = 2000,
  maxAttempts = 300, // 10 minutes max (2000ms * 300 = 600s)
  onStatusChange,
  onAgentThoughtsUpdate,
  onComplete,
  onError,
}: UseGenerationPollingOptions) => {
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
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

  const pollGeneration = useCallback(async () => {
    if (!generationId || !enabled) {
      return;
    }

    try {
      // Poll directly from Supabase database
      const { data: generationData, error: dbError } = await supabase
        .from('generations')
        .select('*')
        .eq('id', generationId)
        .single();

      if (dbError) {
        console.error('[useGenerationPolling] Database error:', dbError);
        
        // If generation not found and we've tried a few times, stop polling
        if (dbError.code === 'PGRST116' && attemptsRef.current > 5) {
          stopPolling();
          onError?.('Generation not found');
        }
        return;
      }

      if (!generationData) {
        console.warn('[useGenerationPolling] No data returned for generation:', generationId);
        return;
      }

      const status = generationData.status;
      
      // Update generation status state
      setGenerationStatus({
        id: generationData.id,
        status,
        files: generationData.files,
        agentThoughts: generationData.agent_thoughts || [],
        error: generationData.error,
        targetLanguage: generationData.target_language,
        complexity: generationData.complexity,
        previewUrl: generationData.preview_url,
        deploymentStatus: generationData.deployment_status,
      });

      // Notify callbacks
      onStatusChange?.(status);
      
      if (generationData.agent_thoughts && generationData.agent_thoughts.length > 0) {
        onAgentThoughtsUpdate?.(generationData.agent_thoughts);
      }

      console.log(`[useGenerationPolling] Generation ${generationId} status: ${status} (${attemptsRef.current}/${maxAttempts})`);

      // Check if generation completed
      if (status === 'completed') {
        console.log('[useGenerationPolling] Generation completed successfully');
        stopPolling();
        
        const result = {
          files: generationData.files,
          agentThoughts: generationData.agent_thoughts || [],
          targetLanguage: generationData.target_language,
          complexity: generationData.complexity,
        };
        
        onComplete?.(result);
        return;
      }

      // Check if generation failed
      if (status === 'failed') {
        console.error('[useGenerationPolling] Generation failed:', generationData.error);
        stopPolling();
        onError?.(generationData.error || 'Generation failed');
        return;
      }

      // Increment attempts
      attemptsRef.current++;
      setAttempts(attemptsRef.current);

      // Check if max attempts reached
      if (attemptsRef.current >= maxAttempts) {
        console.error('[useGenerationPolling] Max attempts reached');
        stopPolling();
        onError?.('Generation timed out. Please try again.');
        return;
      }
    } catch (error: any) {
      console.error('[useGenerationPolling] Polling error:', error);
      
      // Don't stop polling on transient errors, just log them
      if (attemptsRef.current > maxAttempts / 2) {
        stopPolling();
        onError?.(error.message || 'Failed to poll generation');
      }
    }
  }, [generationId, enabled, maxAttempts, onStatusChange, onAgentThoughtsUpdate, onComplete, onError, stopPolling]);

  // Start polling when generationId changes or enabled changes
  useEffect(() => {
    if (!generationId || !enabled) {
      stopPolling();
      return;
    }

    console.warn('⚠️ [useGenerationPolling] Using deprecated polling hook. WebSocket-based tracking should be implemented.');
    console.log(`[useGenerationPolling] Starting polling for generation: ${generationId}`);
    setIsPolling(true);
    attemptsRef.current = 0;
    setAttempts(0);

    // Poll immediately
    pollGeneration();

    // Set up interval
    pollingRef.current = setInterval(pollGeneration, pollInterval);

    // Cleanup on unmount or when generationId/enabled changes
    return () => {
      stopPolling();
    };
  }, [generationId, enabled, pollInterval, pollGeneration, stopPolling]);

  return {
    isPolling,
    attempts,
    generationStatus,
    stopPolling,
    pollNow: pollGeneration,
  };
};
