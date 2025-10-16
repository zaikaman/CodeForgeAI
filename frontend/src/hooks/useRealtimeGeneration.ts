import { useState, useEffect, useRef } from 'react';
import { wsClient } from '../services/websocketClient';
import { useAuthContext } from '../contexts/AuthContext';
import { useGenerationPolling } from './useGenerationPolling';

export interface GenerationProgressUpdate {
  generationId: string;
  agent: string;
  message: string;
  progress?: number;
  timestamp: string;
}

export interface RealtimeGenerationOptions {
  generationId: string | null;
  enabled?: boolean;
  fallbackToPolling?: boolean;
  onProgress?: (update: GenerationProgressUpdate) => void;
  onComplete?: (success: boolean, result?: any, error?: string) => void;
}

/**
 * useRealtimeGeneration Hook
 * 
 * Real-time generation tracking via WebSocket
 * Replaces useGenerationPolling with push-based updates for better performance
 */
export const useRealtimeGeneration = ({
  generationId,
  enabled = true,
  fallbackToPolling = true,
  onProgress,
  onComplete,
}: RealtimeGenerationOptions) => {
  const { user } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [progressUpdates, setProgressUpdates] = useState<GenerationProgressUpdate[]>([]);
  const hasCompletedRef = useRef(false);

  // Stabilize callbacks with refs
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
  }, [onProgress, onComplete]);

  // Reset on generationId change
  useEffect(() => {
    hasCompletedRef.current = false;
    setProgressUpdates([]);
    setGenerationStatus('idle');
  }, [generationId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || !user) return;

    let mounted = true;

    const connectWebSocket = async () => {
      try {
        await wsClient.connect({
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
        });
        
        if (!mounted) return;
        
        wsClient.emit('join:user', user.id);
        setIsConnected(true);
        setUsePollingFallback(false);
        
        console.log('✅ WebSocket ready for realtime generation updates');
      } catch (error: any) {
        if (!mounted) return;
        console.warn('⚠️ WebSocket unavailable for generation tracking');
        
        if (fallbackToPolling) {
          console.log('📡 Falling back to polling...');
          setUsePollingFallback(true);
        }
      }
    };

    connectWebSocket();

    return () => {
      mounted = false;
    };
  }, [enabled, user, fallbackToPolling]);

  // Subscribe to generation events
  useEffect(() => {
    if (!enabled || !generationId || !isConnected) return;

    console.log(`🔌 Subscribing to generation updates for: ${generationId}`);

    // Subscribe to progress events
    const unsubProgress = wsClient.on('generation:progress', (message) => {
      const data = message.data;
      
      if (data.generationId === generationId) {
        console.log(`📊 Generation progress:`, data);
        
        const update: GenerationProgressUpdate = {
          generationId: data.generationId,
          agent: data.agent,
          message: data.message,
          progress: data.progress,
          timestamp: data.timestamp,
        };
        
        setProgressUpdates(prev => [...prev, update]);
        setGenerationStatus('processing');
        onProgressRef.current?.(update);
      }
    });

    // Subscribe to completion events
    const unsubComplete = wsClient.on('generation:complete', (message) => {
      const data = message.data;
      
      if (data.generationId === generationId && !hasCompletedRef.current) {
        console.log(`✅ Generation completed:`, data);
        hasCompletedRef.current = true;
        
        if (data.success) {
          setGenerationStatus('completed');
          onCompleteRef.current?.(true, data.result);
        } else {
          setGenerationStatus('failed');
          onCompleteRef.current?.(false, undefined, data.error);
        }
      }
    });

    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, [enabled, generationId, isConnected]);

  // Fallback to polling if WebSocket fails
  const pollingHook = useGenerationPolling({
    generationId: usePollingFallback ? generationId : null,
    enabled: usePollingFallback && enabled,
    pollInterval: 2000,
    maxAttempts: 300,
    onAgentThoughtsUpdate: (thoughts) => {
      // Convert agent thoughts to progress updates
      const latestThought = thoughts[thoughts.length - 1];
      if (latestThought) {
        const update: GenerationProgressUpdate = {
          generationId: generationId || '',
          agent: latestThought.agent || 'Unknown',
          message: latestThought.content || '',
          timestamp: latestThought.timestamp || new Date().toISOString(),
        };
        setProgressUpdates(prev => [...prev, update]);
        onProgressRef.current?.(update);
      }
    },
    onComplete: onCompleteRef.current,
    onError: (error) => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.(false, undefined, error);
      }
    },
  });

  return {
    isConnected: usePollingFallback ? false : isConnected,
    generationStatus: usePollingFallback ? pollingHook.generationStatus?.status || 'idle' : generationStatus,
    progressUpdates,
    mode: usePollingFallback ? 'polling' : 'realtime',
    // Expose polling hook data if in fallback mode
    ...(usePollingFallback && {
      isPolling: pollingHook.isPolling,
      attempts: pollingHook.attempts,
    }),
  };
};
