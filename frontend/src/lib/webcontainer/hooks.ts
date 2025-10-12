import { useState, useEffect } from 'react';
import { getWebContainerStatus } from './reset';

/**
 * React hook to monitor WebContainer status
 * Returns current status and updates when state changes
 */
export function useWebContainerStatus() {
  const [status, setStatus] = useState(getWebContainerStatus());

  useEffect(() => {
    // Poll status every second (lightweight check)
    const interval = setInterval(() => {
      const currentStatus = getWebContainerStatus();
      setStatus(currentStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * React hook to get WebContainer ready state
 * Returns true when container is fully initialized and ready
 */
export function useWebContainerReady() {
  const status = useWebContainerStatus();
  return status.mounted && status.installed && status.serverRunning;
}

/**
 * React hook to get preview URL
 * Returns the current preview URL or null if not ready
 */
export function usePreviewUrl() {
  const status = useWebContainerStatus();
  return status.serverUrl;
}
