import { useState } from 'react';
import axios from 'axios';

interface DeployButtonProps {
  projectId: string;
  files: Array<{ path: string; content: string }>;
  onDeployStart?: () => void;
  onDeployComplete?: (url: string) => void;
  onDeployError?: (error: string) => void;
}

export function DeployButton({
  projectId,
  files,
  onDeployStart,
  onDeployComplete,
  onDeployError,
}: DeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployUrl, setDeployUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeployStatus('deploying');
      setErrorMessage('');
      onDeployStart?.();

      console.log('[DeployButton] Starting deployment to fly.io...');

      // Call backend API to deploy to fly.io
      const response = await axios.post('/api/deploy', {
        projectId,
        files,
        platform: 'fly.io',
      });

      if (response.data.success) {
        const url = response.data.deploymentUrl;
        setDeployUrl(url);
        setDeployStatus('success');
        onDeployComplete?.(url);
        console.log('[DeployButton] Deployment successful:', url);
      } else {
        throw new Error(response.data.message || 'Deployment failed');
      }
    } catch (error) {
      console.error('[DeployButton] Deployment error:', error);
      const message = error instanceof Error ? error.message : 'Deployment failed';
      setErrorMessage(message);
      setDeployStatus('error');
      onDeployError?.(message);
    } finally {
      setIsDeploying(false);
    }
  };

  const getButtonText = () => {
    switch (deployStatus) {
      case 'deploying':
        return 'Deploying...';
      case 'success':
        return 'Deployed Successfully';
      case 'error':
        return 'Deployment Failed';
      default:
        return 'Deploy to Fly.io';
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
    <div className="deploy-button-container">
      <button
        onClick={handleDeploy}
        disabled={isDeploying || !files || files.length === 0}
        className={`
          px-4 py-2 rounded-lg font-medium text-white
          ${getButtonColor()}
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          flex items-center gap-2
        `}
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
              d="M5 13l4 4L19 7"
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

      {deployStatus === 'success' && deployUrl && (
        <div className="mt-2 p-3 bg-green-900/20 border border-green-500 rounded-lg">
          <p className="text-sm text-green-400 mb-1">🎉 Deployment successful!</p>
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
          >
            {deployUrl}
          </a>
        </div>
      )}

      {deployStatus === 'error' && errorMessage && (
        <div className="mt-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-sm text-red-400">❌ {errorMessage}</p>
        </div>
      )}

      {deployStatus === 'idle' && (
        <p className="mt-2 text-xs text-gray-500">
          Deploy your app to fly.io for production hosting
        </p>
      )}
    </div>
  );
}
