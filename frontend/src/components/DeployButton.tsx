import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

interface DeployButtonProps {
  projectId: string;
  files: Array<{ path: string; content: string }>;
  projectStatus?: 'pending' | 'processing' | 'completed' | 'failed';
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
  projectStatus = 'pending',
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

  // Helper to update status and notify parent
  const updateStatus = (status: 'idle' | 'deploying' | 'success' | 'error') => {
    setDeployStatus(status);
    onStatusChange?.(status);
  };

  const pollDeploymentStatus = async (projectId: string): Promise<void> => {
    const maxAttempts = 60; // 5 minutes (5 seconds interval)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await apiClient.request({
          method: 'GET',
          url: `/api/deploy/${projectId}`,
        });

        if (response.success && response.data) {
          const { deploymentStatus, deploymentUrl, error } = response.data;

          if (deploymentStatus === 'deployed' && deploymentUrl) {
            updateStatus('success');
            setIsDeploying(false);
            setDeployedUrl(deploymentUrl);
            onDeployComplete?.(deploymentUrl);
            console.log('[DeployButton] Deployment successful:', deploymentUrl);
            return;
          }

          if (deploymentStatus === 'failed') {
            throw new Error(error || 'Deployment failed');
          }

          // Still deploying, wait and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        } else {
          throw new Error('Failed to get deployment status');
        }
      } catch (error) {
        console.error('[DeployButton] Status check error:', error);
        const message = error instanceof Error ? error.message : 'Failed to check deployment status';
        updateStatus('error');
        setIsDeploying(false);
        onDeployError?.(message);
        return;
      }
    }

    // Timeout
    updateStatus('error');
    setIsDeploying(false);
    onDeployError?.('Deployment timeout');
  };

  const handleDeploy = async () => {
    // If already deployed, open the URL in a new tab
    if (deployStatus === 'success' && deployedUrl) {
      window.open(deployedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Check if project is completed
    if (projectStatus !== 'completed') {
      const statusMessage = projectStatus === 'processing' 
        ? 'Project is still generating. Please wait...'
        : projectStatus === 'failed'
        ? 'Project generation failed. Cannot deploy.'
        : 'Project must be completed before deployment.';
      
      console.warn('[DeployButton]', statusMessage);
      onDeployError?.(statusMessage);
      return;
    }

    try {
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
        console.log('[DeployButton] Deployment started, polling for status...');
        // Start polling for status
        await pollDeploymentStatus(projectId);
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
    if (initialDeploymentUrl) {
      setDeployedUrl(initialDeploymentUrl);
      
      if (initialDeploymentStatus === 'deployed') {
        updateStatus('success');
      } else if (initialDeploymentStatus === 'deploying') {
        updateStatus('deploying');
        setIsDeploying(true);
        // Start polling if deployment is in progress
        pollDeploymentStatus(projectId);
      } else if (initialDeploymentStatus === 'failed') {
        updateStatus('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeploymentUrl, initialDeploymentStatus]);

  const getButtonText = () => {
    if (projectStatus !== 'completed' && deployStatus === 'idle') {
      return projectStatus === 'processing' ? 'GENERATING...' : 'NOT READY';
    }
    
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
    <button
      onClick={handleDeploy}
      disabled={isDeploying || !files || files.length === 0 || (projectStatus !== 'completed' && deployStatus === 'idle')}
      className={`
        px-6 py-2 rounded-lg font-medium text-white text-sm
        ${getButtonColor()}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        flex items-center gap-2
      `}
      title={projectStatus !== 'completed' && deployStatus === 'idle' 
        ? 'Project must be completed before deployment' 
        : undefined
      }
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
  );
}
