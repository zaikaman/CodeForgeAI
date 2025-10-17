import { useState, useEffect, useRef } from 'react';
import { wsClient } from '../services/websocketClient';
import { useAuthContext } from '../contexts/AuthContext';

export interface DeploymentProgress {
  step: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  message?: string;
}

export interface RealtimeDeploymentOptions {
  projectId: string | null;
  enabled?: boolean;
  fallbackToPolling?: boolean;
  onProgress?: (progress: DeploymentProgress) => void;
  onComplete?: (success: boolean, deploymentUrl?: string, error?: string) => void;
}

/**
 * useRealtimeDeployment Hook
 * 
 * Real-time deployment tracking via WebSocket
 * Replaces polling with push-based updates for better performance
 */
export const useRealtimeDeployment = ({
  projectId,
  enabled = true,
  fallbackToPolling = false,
  onProgress,
  onComplete,
}: RealtimeDeploymentOptions) => {
  const { user } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState<DeploymentProgress[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const hasCompletedRef = useRef(false);

  // Stabilize callbacks with refs
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
  }, [onProgress, onComplete]);

  // Reset on projectId change
  useEffect(() => {
    hasCompletedRef.current = false;
    setDeploymentProgress([]);
    setDeploymentStatus('idle');
    setDeployedUrl(null);
  }, [projectId]);

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
        
        console.log('✅ WebSocket ready for realtime deployment updates');
      } catch (error: any) {
        if (!mounted) return;
        console.warn('⚠️ WebSocket unavailable for deployment tracking');
        
        if (fallbackToPolling) {
          console.warn('⚠️ Falling back to polling (not implemented yet)');
        }
      }
    };

    connectWebSocket();

    return () => {
      mounted = false;
    };
  }, [enabled, user, fallbackToPolling]);

  // Subscribe to deployment events
  useEffect(() => {
    if (!enabled || !projectId || !isConnected) {
      console.log(`[useRealtimeDeployment] Skipping subscription:`, {
        enabled,
        hasProjectId: !!projectId,
        isConnected
      });
      return;
    }

    console.log(`🔌 Subscribing to deployment updates for project: ${projectId}`);
    setDeploymentStatus('deploying');

    // Subscribe to progress events
    const unsubProgress = wsClient.on('deployment:progress', (message) => {
      console.log(`[useRealtimeDeployment] Raw progress message:`, message);
      const data = message.data;
      
      if (data.projectId === projectId) {
        console.log(`📊 Deployment progress for ${projectId}:`, data);
        
        const progress: DeploymentProgress = {
          step: data.step,
          status: data.status,
          timestamp: data.timestamp || new Date().toISOString(),
          message: data.message,
        };
        
        setDeploymentProgress(prev => {
          console.log(`[useRealtimeDeployment] Adding progress, prev length: ${prev.length}`);
          return [...prev, progress];
        });
        onProgressRef.current?.(progress);
      } else {
        console.log(`[useRealtimeDeployment] Progress for different project: ${data.projectId} (expecting ${projectId})`);
      }
    });

    // Subscribe to completion events
    const unsubComplete = wsClient.on('deployment:complete', (message) => {
      console.log(`[useRealtimeDeployment] Raw complete message:`, message);
      const data = message.data;
      
      if (data.projectId === projectId && !hasCompletedRef.current) {
        console.log(`✅ Deployment completed for ${projectId}:`, data);
        hasCompletedRef.current = true;
        
        if (data.success) {
          setDeploymentStatus('success');
          setDeployedUrl(data.deploymentUrl || null);
          onCompleteRef.current?.(true, data.deploymentUrl);
        } else {
          setDeploymentStatus('error');
          onCompleteRef.current?.(false, undefined, data.error);
        }
      } else if (data.projectId !== projectId) {
        console.log(`[useRealtimeDeployment] Complete for different project: ${data.projectId} (expecting ${projectId})`);
      } else if (hasCompletedRef.current) {
        console.log(`[useRealtimeDeployment] Already completed, ignoring duplicate`);
      }
    });

    console.log(`[useRealtimeDeployment] Subscribed to deployment events`);

    return () => {
      console.log(`[useRealtimeDeployment] Unsubscribing from deployment events for ${projectId}`);
      unsubProgress();
      unsubComplete();
    };
  }, [enabled, projectId, isConnected]);

  return {
    isConnected,
    deploymentStatus,
    deploymentProgress,
    deployedUrl,
  };
};
