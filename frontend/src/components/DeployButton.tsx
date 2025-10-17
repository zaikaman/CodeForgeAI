import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useRealtimeDeployment } from '../hooks/useRealtimeDeployment';
import './DeployButton.css';

interface DeployButtonProps {
  projectId: string;
  files: Array<{ path: string; content: string }>;
  initialDeploymentUrl?: string | null;
  initialDeploymentStatus?: 'pending' | 'deploying' | 'deployed' | 'failed' | null;
  onDeployStart?: () => void;
  onDeployComplete?: (url: string) => void;
  onDeployError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'deploying' | 'success' | 'error') => void;
}

export function DeployButton({
  projectId,
  files,
  initialDeploymentUrl,
  initialDeploymentStatus,
  onDeployStart,
  onDeployComplete,
  onDeployError,
  onStatusChange,
}: DeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState<Array<{
    step: string;
    status: 'running' | 'completed' | 'failed';
    timestamp: string;
    message?: string;
  }>>([]);

  // Use WebSocket for realtime deployment tracking (no more polling!)
  const realtimeDeployment = useRealtimeDeployment({
    projectId: isDeploying ? projectId : null,
    enabled: isDeploying,
    onProgress: (progress) => {
      console.log('[DeployButton] Progress received:', progress);
      setDeploymentProgress(prev => [...prev, progress]);
    },
    onComplete: (success, deploymentUrl, error) => {
      console.log('[DeployButton] Deployment complete:', { success, deploymentUrl, error });
      setIsDeploying(false);
      
      if (success && deploymentUrl) {
        updateStatus('success');
        setDeployedUrl(deploymentUrl);
        onDeployComplete?.(deploymentUrl);
      } else {
        updateStatus('error');
        onDeployError?.(error || 'Deployment failed');
      }
    },
  });

  console.log('[DeployButton] State:', {
    isDeploying,
    deployStatus,
    hasUrl: !!deployedUrl,
    progressCount: deploymentProgress.length,
    realtimeConnected: realtimeDeployment.isConnected,
    realtimeStatus: realtimeDeployment.deploymentStatus,
  });

  // Helper to update status and notify parent
  const updateStatus = (status: 'idle' | 'deploying' | 'success' | 'error') => {
    setDeployStatus(status);
    onStatusChange?.(status);
  };

  const handleDeploy = async () => {
    try {
      // Clear previous deployment state before starting new one
      setDeploymentProgress([]);
      setIsDeploying(true);
      updateStatus('deploying');
      onDeployStart?.();

      console.log('[DeployButton] Starting deployment to fly.io...');

      // Call backend API to deploy to fly.io (using apiClient for auth)
      const response = await apiClient.request({
        method: 'POST',
        url: '/api/deploy',
        data: {
          projectId,
          files,
          platform: 'fly.io',
        },
      });

      if (response.success && response.data) {
        console.log('[DeployButton] Deployment started');
        // WebSocket will handle all updates automatically
      } else {
        throw new Error(response.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('[DeployButton] Deployment error:', error);
      const message = error instanceof Error ? error.message : 'Deployment failed';
      updateStatus('error');
      setIsDeploying(false);
      onDeployError?.(message);
    }
  };

  // Initialize state from database values
  useEffect(() => {
    const initializeFromDatabase = async () => {
      if (initialDeploymentUrl) {
        setDeployedUrl(initialDeploymentUrl);
        
        if (initialDeploymentStatus === 'deployed') {
          updateStatus('success');
        } else if (initialDeploymentStatus === 'deploying') {
          console.log('[DeployButton] Found ongoing deployment from DB, loading progress and subscribing...');
          updateStatus('deploying');
          setIsDeploying(true);
          
          // Load existing progress from database
          try {
            const response = await apiClient.request({
              method: 'GET',
              url: `/api/deploy/${projectId}`,
            });

            if (response.success && response.data?.progress) {
              console.log('[DeployButton] Loaded existing progress:', response.data.progress);
              setDeploymentProgress(response.data.progress);
            }
          } catch (error) {
            console.error('[DeployButton] Failed to load progress:', error);
          }
          
          // WebSocket will pick up new progress automatically when isDeploying becomes true
        } else if (initialDeploymentStatus === 'failed') {
          updateStatus('error');
        }
      }
    };

    initializeFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeploymentUrl, initialDeploymentStatus, projectId]);

  // Monitor when deployment finishes by checking WebSocket updates
  // This ensures the button updates even when the page is refreshed
  useEffect(() => {
    // If deploying but no progress in 5 seconds, check deployment status via API
    if (!isDeploying) return;

    const checkTimeout = setTimeout(async () => {
      if (deploymentProgress.length === 0) {
        console.log('[DeployButton] No progress received, checking deployment status...');
        
        try {
          const response = await apiClient.request({
            method: 'GET',
            url: `/api/deploy/${projectId}/status`,
          });

          if (response.success && response.data) {
            const { status, url } = response.data;
            
            if (status === 'deployed' && url) {
              console.log('[DeployButton] Deployment already completed:', url);
              setIsDeploying(false);
              updateStatus('success');
              setDeployedUrl(url);
              onDeployComplete?.(url);
            } else if (status === 'failed') {
              console.log('[DeployButton] Deployment failed');
              setIsDeploying(false);
              updateStatus('error');
              onDeployError?.('Deployment failed');
            }
          }
        } catch (error) {
          console.error('[DeployButton] Failed to check deployment status:', error);
        }
      }
    }, 5000); // Wait 5 seconds before checking

    return () => clearTimeout(checkTimeout);
  }, [isDeploying, deploymentProgress.length, projectId, onDeployComplete, onDeployError]);

  const getButtonText = () => {
    switch (deployStatus) {
      case 'deploying':
        return 'DEPLOYING...';
      case 'success':
        return 'VIEW PAGE';
      case 'error':
        return 'DEPLOY FAILED';
      default:
        return 'DEPLOY';
    }
  };

  const getButtonColor = () => {
    switch (deployStatus) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Button(s) */}
      {deployStatus === 'success' && deployedUrl ? (
        // Show both buttons when already deployed
        <div className="w-full max-w-md flex gap-3">
          <button
            onClick={() => window.open(deployedUrl, '_blank', 'noopener,noreferrer')}
            className="flex-1 px-6 py-3 rounded font-bold text-white text-base bg-green-600 hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 border-2 border-green-400 shadow-lg hover:shadow-xl font-mono tracking-wider"
            style={{ boxShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            VIEW PAGE
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying || !files || files.length === 0}
            className="flex-1 px-6 py-3 rounded font-bold text-white text-base bg-[#ffaa00] hover:bg-[#ff9900] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 border-2 border-[#ffaa00] shadow-lg hover:shadow-xl font-mono tracking-wider"
            style={{ boxShadow: '0 0 15px rgba(255, 170, 0, 0.5)' }}
          >
            {isDeploying && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {!isDeploying && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isDeploying ? 'DEPLOYING...' : 'REDEPLOY'}
          </button>
        </div>
      ) : (
        // Show single button (original behavior)
      <button
        onClick={handleDeploy}
        disabled={isDeploying || !files || files.length === 0}
        className={`
          w-full max-w-md px-8 py-3 rounded font-bold text-white text-base
          ${getButtonColor()}
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          flex items-center justify-center gap-3
          border-2 ${deployStatus === 'success' ? 'border-green-400' : deployStatus === 'error' ? 'border-red-400' : 'border-blue-400'}
          shadow-lg hover:shadow-xl
          font-mono tracking-wider
        `}
        style={{
          boxShadow: deployStatus === 'deploying' 
            ? '0 0 15px rgba(79, 195, 247, 0.5)' 
            : deployStatus === 'success'
            ? '0 0 15px rgba(0, 255, 65, 0.5)'
            : deployStatus === 'error'
            ? '0 0 15px rgba(255, 51, 51, 0.5)'
            : undefined
        }}
      >
      {isDeploying && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {deployStatus === 'success' && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
      {deployStatus === 'error' && (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      {getButtonText()}
    </button>
      )}

      {/* Deployment Progress Log - Show when deploying OR has progress */}
      {(isDeploying || deploymentProgress.length > 0) && (
        <div className="w-full max-w-2xl mt-4 bg-[#0a0e0f] border-2 border-[#4fc3f7] rounded-lg shadow-lg overflow-hidden font-mono text-sm">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-[#1a1f26] to-[#0a0e0f] px-4 py-2 border-b border-[#4fc3f7]/30 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff3333]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffaa00]"></div>
              <div className="w-3 h-3 rounded-full bg-[#00ff41]"></div>
            </div>
            <span className="text-[#4fc3f7] ml-2 font-bold tracking-wider">DEPLOYMENT PROGRESS</span>
          </div>

          {/* Progress Steps */}
          <div className="p-4 max-h-64 overflow-y-auto scrollbar-terminal">
            {deploymentProgress.length > 0 ? (
              deploymentProgress.map((progress, index) => (
                <div key={index} className="mb-2 flex items-start gap-2">
                  {progress.status === 'completed' && (
                    <span className="text-[#00ff41] font-bold">✓</span>
                  )}
                  {progress.status === 'running' && (
                    <span className="text-[#4fc3f7] font-bold animate-pulse">⟳</span>
                  )}
                  {progress.status === 'failed' && (
                    <span className="text-[#ff3333] font-bold">✗</span>
                  )}
                  <div className="flex-1">
                    <span className={`
                      ${progress.status === 'completed' ? 'text-[#00aa2a]' : ''}
                      ${progress.status === 'running' ? 'text-[#4fc3f7]' : ''}
                      ${progress.status === 'failed' ? 'text-[#ff3333]' : ''}
                    `}>
                      {progress.step}
                    </span>
                    {progress.message && (
                      <div className="text-[#bdbdbd] text-xs mt-1 ml-4">
                        {progress.message}
                      </div>
                    )}
                  </div>
                  <span className="text-[#666] text-xs whitespace-nowrap">
                    {new Date(progress.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[#4fc3f7] flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Waiting for deployment to start...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
