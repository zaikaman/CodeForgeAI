import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../services/websocketClient';
import { useAuthContext } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

export interface RealtimeJobsListOptions {
  enabled?: boolean;
  fallbackPollingInterval?: number; // 0 = no fallback polling
  onActiveJobsChange?: (count: number) => void;
}

/**
 * useRealtimeJobsList Hook
 * 
 * Replaces BackgroundJobsPanel polling with WebSocket-based real-time updates
 * Receives push notifications when jobs list changes
 */
export const useRealtimeJobsList = ({
  enabled = true,
  fallbackPollingInterval = 0, // Disabled by default
  onActiveJobsChange,
}: RealtimeJobsListOptions = {}) => {
  const { user } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch jobs from API (initial load or manual refresh)
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('⏩ fetchJobs already in progress, skipping...');
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isFetchingRef.current = true;
    setLoading(true);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await apiClient.getUserJobs(user.id);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('⏹️ getUserJobs request was aborted');
        return;
      }
      
      if (response.success && response.data) {
        const newJobs = response.data.jobs;
        setJobs(newJobs);
        
        const active = newJobs.filter((j: any) => 
          j.status === 'processing' || j.status === 'pending'
        ).length;
        
        setActiveCount(active);
        onActiveJobsChange?.(active);
      }
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('⏹️ getUserJobs request was canceled');
        return;
      }
      console.error('Error fetching jobs:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [user, onActiveJobsChange]);

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
        
        console.log('✅ WebSocket ready for realtime jobs list updates');
        
        // Initial fetch
        fetchJobs();
      } catch (error: any) {
        if (!mounted) return;
        console.warn('⚠️ WebSocket unavailable, using API polling:', error.message);
        
        // Still do initial fetch even if WebSocket fails
        fetchJobs();
      }
    };

    connectWebSocket();
    
    return () => {
      mounted = false;
      // Cancel any ongoing request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, user, fetchJobs]);

  // Subscribe to jobs list updates
  useEffect(() => {
    if (!enabled || !user || !isConnected) return;

    console.log('🔌 Subscribing to realtime jobs list updates');

    const unsubscribe = wsClient.on('user:jobs:update', (message) => {
      const data = message.data;
      
      if (data.userId === user.id) {
        console.log('📊 Jobs list updated:', {
          activeCount: data.activeCount,
          totalJobs: data.jobs.length,
        });
        
        setJobs(data.jobs);
        setActiveCount(data.activeCount);
        onActiveJobsChange?.(data.activeCount);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, user, isConnected, onActiveJobsChange]);

  // Fallback polling (optional, disabled by default)
  useEffect(() => {
    if (!enabled || !user || fallbackPollingInterval <= 0) return;

    const interval = setInterval(() => {
      if (!isConnected) {
        console.log('⚠️ WebSocket disconnected, using fallback polling');
        fetchJobs();
      }
    }, fallbackPollingInterval);

    return () => clearInterval(interval);
  }, [enabled, user, isConnected, fallbackPollingInterval, fetchJobs]);

  return {
    jobs,
    activeCount,
    loading,
    isConnected,
    refresh: fetchJobs,
  };
};
