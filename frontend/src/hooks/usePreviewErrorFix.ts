/**
 * usePreviewErrorFix Hook
 * Manages automatic error detection and fixing for preview errors
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/services/apiClient';
import { PreviewError } from '@/utils/previewErrorCapture';

interface UsePreviewErrorFixOptions {
  generationId: string;
  currentFiles: Array<{ path: string; content: string }>;
  language: string;
  autoFix?: boolean; // Automatically attempt to fix errors when detected
  debounceMs?: number; // Debounce time before attempting fix (default 2000ms)
  onFixStart?: () => void;
  onFixComplete?: (files: Array<{ path: string; content: string }>) => void;
  onFixError?: (error: string) => void;
}

interface ErrorFixState {
  isFixing: boolean;
  fixJobId: string | null;
  fixAttempts: number;
  lastFixTime: Date | null;
  errorCount: number;
  lastErrorSignature: string | null; // Prevent re-fixing same errors
}

export function usePreviewErrorFix(options: UsePreviewErrorFixOptions) {
  const {
    generationId,
    currentFiles,
    language,
    autoFix = false,
    debounceMs = 2000,
    onFixStart,
    onFixComplete,
    onFixError,
  } = options;

  const [state, setState] = useState<ErrorFixState>({
    isFixing: false,
    fixJobId: null,
    fixAttempts: 0,
    lastFixTime: null,
    errorCount: 0,
    lastErrorSignature: null,
  });

  const [pendingErrors, setPendingErrors] = useState<PreviewError[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle new preview errors
   */
  const handlePreviewErrors = useCallback((errors: PreviewError[]) => {
    console.log('[usePreviewErrorFix] New errors detected:', errors.length);
    
    // Create error signature to detect duplicate errors
    const errorSignature = errors
      .map(e => `${e.type}:${e.message}:${e.file}:${e.line}`)
      .sort()
      .join('|');
    
    // Check if these are the same errors we just tried to fix
    if (state.lastErrorSignature === errorSignature) {
      console.warn('[usePreviewErrorFix] Same errors detected after fix - stopping auto-fix to prevent loop');
      setState(prev => ({ ...prev, errorCount: errors.length }));
      setPendingErrors(errors);
      return;
    }
    
    // Check cooldown period (minimum 10 seconds between auto-fixes)
    const now = Date.now();
    if (state.lastFixTime && (now - state.lastFixTime.getTime()) < 10000) {
      console.warn('[usePreviewErrorFix] Too soon after last fix - waiting for cooldown');
      setState(prev => ({ ...prev, errorCount: errors.length }));
      setPendingErrors(errors);
      return;
    }
    
    setState(prev => ({ ...prev, errorCount: errors.length }));
    setPendingErrors(errors);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only auto-fix if enabled and not already fixing
    if (autoFix && !state.isFixing && errors.length > 0) {
      // Debounce to avoid fixing too frequently
      debounceTimerRef.current = setTimeout(() => {
        attemptFix(errors, errorSignature);
      }, debounceMs);
    }
  }, [autoFix, state.isFixing, state.lastFixTime, state.lastErrorSignature, debounceMs]);

  /**
   * Manually trigger fix attempt
   */
  const attemptFix = useCallback(async (errors?: PreviewError[], errorSignature?: string) => {
    const errorsToFix = errors || pendingErrors;

    if (errorsToFix.length === 0) {
      console.log('[usePreviewErrorFix] No errors to fix');
      return;
    }

    if (state.isFixing) {
      console.log('[usePreviewErrorFix] Already fixing errors');
      return;
    }

    console.log(`[usePreviewErrorFix] Attempting to fix ${errorsToFix.length} error(s)...`);

    setState(prev => ({
      ...prev,
      isFixing: true,
      fixAttempts: prev.fixAttempts + 1,
      lastFixTime: new Date(),
      lastErrorSignature: errorSignature || prev.lastErrorSignature,
    }));

    onFixStart?.();

    try {
      // Send errors to backend for fixing
      const response = await apiClient.fixPreviewErrors({
        generationId,
        currentFiles,
        errors: errorsToFix.map(e => ({
          type: e.type,
          message: e.message,
          stack: e.stack,
          file: e.file,
          line: e.line,
          column: e.column,
        })),
        language,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to submit fix request');
      }

      const jobId = response.data.jobId;
      setState(prev => ({ ...prev, fixJobId: jobId }));

      // Start polling for result
      startPolling(jobId);

    } catch (error) {
      console.error('[usePreviewErrorFix] Fix attempt failed:', error);
      setState(prev => ({ ...prev, isFixing: false, fixJobId: null }));
      onFixError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [pendingErrors, state.isFixing, generationId, currentFiles, language, onFixStart, onFixError]);

  /**
   * Poll for fix job status
   */
  const startPolling = useCallback((jobId: string) => {
    // Clear existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const pollStatus = async () => {
      try {
        const response = await apiClient.getFixErrorsStatus(jobId);

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to get fix status');
        }

        const { status, files, error } = response.data;

        console.log(`[usePreviewErrorFix] Fix job status: ${status}`);

        if (status === 'completed') {
          // Fix completed successfully
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          setState(prev => ({
            ...prev,
            isFixing: false,
            fixJobId: null,
            errorCount: 0,
          }));

          setPendingErrors([]);

          if (files && files.length > 0) {
            onFixComplete?.(files);
          }

        } else if (status === 'error') {
          // Fix failed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          setState(prev => ({
            ...prev,
            isFixing: false,
            fixJobId: null,
          }));

          onFixError?.(error || 'Fix job failed');
        }
        // If pending or processing, continue polling

      } catch (error) {
        console.error('[usePreviewErrorFix] Polling error:', error);
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        setState(prev => ({
          ...prev,
          isFixing: false,
          fixJobId: null,
        }));

        onFixError?.(error instanceof Error ? error.message : 'Polling failed');
      }
    };

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    // Also poll immediately
    pollStatus();
  }, [onFixComplete, onFixError]);

  /**
   * Cancel ongoing fix
   */
  const cancelFix = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setState(prev => ({
      ...prev,
      isFixing: false,
      fixJobId: null,
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearErrors = useCallback(() => {
    setPendingErrors([]);
    setState(prev => ({ ...prev, errorCount: 0 }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isFixing: state.isFixing,
    fixAttempts: state.fixAttempts,
    lastFixTime: state.lastFixTime,
    errorCount: state.errorCount,
    pendingErrors,
    
    // Actions
    handlePreviewErrors,
    attemptFix,
    cancelFix,
    clearErrors,
  };
}
