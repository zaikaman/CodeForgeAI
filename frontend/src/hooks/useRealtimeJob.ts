import { useState, useEffect, useRef } from 'react';
import { wsClient } from '../services/websocketClient';
import { useAuthContext } from '../contexts/AuthContext';
import { useChatJobPolling } from './useChatJobPolling'; // Fallback

export interface RealtimeJobOptions {
  jobId: string | null;
  enabled?: boolean;
  fallbackToPolling?: boolean; // Auto-fallback if WebSocket fails
  onProgress?: (data: any) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

/**
 * useRealtimeJob Hook
 * 
 * Replaces useChatJobPolling with WebSocket-based real-time updates
 * Automatically falls back to polling if WebSocket connection fails
 */
export const useRealtimeJob = ({
  jobId,
  enabled = true,
  fallbackToPolling = true,
  onProgress,
  onComplete,
  onError,
}: RealtimeJobOptions) => {
  const { user } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const hasCompletedRef = useRef(false);
  const hasErroredRef = useRef(false);

  // Stabilize callbacks with refs to prevent useEffect re-runs
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onProgress, onComplete, onError]);

  // Reset completion flags when jobId changes
  useEffect(() => {
    hasCompletedRef.current = false;
    hasErroredRef.current = false;
  }, [jobId]);

  // Connect to WebSocket (only once per app lifetime)
  useEffect(() => {
    if (!enabled || !user) return;

    let mounted = true;

    const connectWebSocket = async () => {
      try {
        // Connect (will reuse existing connection if already connected)
        await wsClient.connect({
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
        });
        
        if (!mounted) return;
        
        // Join user-specific room
        wsClient.emit('join:user', user.id);
        setIsConnected(true);
        setUsePollingFallback(false);
        
        console.log('✅ WebSocket ready for realtime job updates');
      } catch (error: any) {
        if (!mounted) return;
        console.warn('⚠️ WebSocket unavailable, using polling fallback');
        
        if (fallbackToPolling) {
          setUsePollingFallback(true);
        }
      }
    };

    connectWebSocket();

    return () => {
      mounted = false;
    };
  }, [enabled, user, fallbackToPolling]);

  // Subscribe to job events
  useEffect(() => {
    if (!enabled || !jobId || !isConnected) return;

    console.log(`🔌 Subscribing to realtime updates for job: ${jobId}`);

    // Subscribe to progress events
    const unsubProgress = wsClient.on('job:progress', (message) => {
      const data = message.data;
      
      if (data.jobId === jobId) {
        console.log(`📊 Job progress update:`, data);
        setJobData(data);
        onProgressRef.current?.(data); // Use ref
      }
    });

    // Subscribe to completion events
    const unsubComplete = wsClient.on('job:complete', (message) => {
      const data = message.data;
      
      if (data.jobId === jobId && !hasCompletedRef.current) {
        console.log(`✅ Job completed:`, data);
        hasCompletedRef.current = true;
        setJobData(data);
        
        if (data.success) {
          onCompleteRef.current?.(data.result); // Use ref
        } else {
          if (!hasErroredRef.current) {
            hasErroredRef.current = true;
            onErrorRef.current?.(data.error || 'Job failed'); // Use ref
          }
        }
      }
    });

    // Subscribe to agent messages
    const unsubAgentMsg = wsClient.on('job:agent:message', (message) => {
      const data = message.data;
      
      if (data.jobId === jobId) {
        console.log(`💬 Agent message:`, data);
        // Can be used to update UI with agent thoughts
      }
    });

    // Subscribe to chat progress (for chat jobs specifically)
    const unsubChatProgress = wsClient.on('chat:progress', (message) => {
      const data = message.data;
      
      console.log(`💬 Chat progress received:`, message);
      console.log(`💬 Chat progress data:`, data);
      console.log(`💬 Progress messages:`, data.progressMessages);
      
      if (data.jobId === jobId) {
        console.log(`💬 Chat progress for current job:`, data);
        onProgressRef.current?.(data); // Use ref
      }
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubAgentMsg();
      unsubChatProgress();
    };
  }, [enabled, jobId, isConnected]); // Remove callback dependencies

  // Fallback to polling if WebSocket fails
  const pollingHook = useChatJobPolling({
    jobId: usePollingFallback ? jobId : null,
    enabled: usePollingFallback && enabled,
    pollInterval: 500,
    maxAttempts: 1000,
    onProgressUpdate: onProgressRef.current, // Use ref for consistency
    onComplete: onCompleteRef.current, // Use ref for consistency
    onError: onErrorRef.current, // Use ref for consistency
  });

  return {
    isConnected: usePollingFallback ? false : isConnected,
    jobData,
    mode: usePollingFallback ? 'polling' : 'realtime',
    // Expose polling hook data if in fallback mode
    ...(usePollingFallback && {
      isPolling: pollingHook.isPolling,
      attempts: pollingHook.attempts,
    }),
  };
};
