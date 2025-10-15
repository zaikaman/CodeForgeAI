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

  // Reset completion flags when jobId changes
  useEffect(() => {
    hasCompletedRef.current = false;
    hasErroredRef.current = false;
  }, [jobId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || !user) return;

    const connectWebSocket = async () => {
      try {
        if (!wsClient.getConnectionStatus()) {
          await wsClient.connect();
        }
        
        // Join user-specific room
        wsClient.emit('join:user', user.id);
        setIsConnected(true);
        setUsePollingFallback(false);
        
        console.log('✅ WebSocket connected for realtime job updates');
      } catch (error: any) {
        console.error('❌ WebSocket connection failed:', error);
        
        if (fallbackToPolling) {
          console.log('⚠️ Falling back to polling mode');
          setUsePollingFallback(true);
        }
      }
    };

    connectWebSocket();

    return () => {
      // Don't disconnect on unmount - keep connection alive for other components
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
        onProgress?.(data);
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
          onComplete?.(data.result);
        } else {
          if (!hasErroredRef.current) {
            hasErroredRef.current = true;
            onError?.(data.error || 'Job failed');
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
      
      if (data.jobId === jobId) {
        console.log(`💬 Chat progress:`, data);
        onProgress?.(data);
      }
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubAgentMsg();
      unsubChatProgress();
    };
  }, [enabled, jobId, isConnected, onProgress, onComplete, onError]);

  // Fallback to polling if WebSocket fails
  const pollingHook = useChatJobPolling({
    jobId: usePollingFallback ? jobId : null,
    enabled: usePollingFallback && enabled,
    pollInterval: 500,
    maxAttempts: 1000,
    onProgressUpdate: onProgress,
    onComplete,
    onError,
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
