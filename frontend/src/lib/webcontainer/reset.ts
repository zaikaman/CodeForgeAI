import { webcontainerState } from './state';
import { webcontainer } from './index';

/**
 * Reset WebContainer state and optionally restart server
 * Useful when you want to start fresh with new files
 */
export async function resetWebContainer(options?: {
  clearFiles?: boolean;
  restartServer?: boolean;
}): Promise<void> {
  const { clearFiles = false, restartServer = false } = options || {};

  console.log('[WebContainer] Resetting state...');
  
  // Stop server and reset state
  await webcontainerState.reset();

  if (clearFiles) {
    try {
      const container = await webcontainer;
      // Clear all files in the working directory
      console.log('[WebContainer] Clearing files...');
      await container.fs.rm('/', { recursive: true, force: true });
    } catch (error) {
      console.error('[WebContainer] Failed to clear files:', error);
    }
  }

  if (restartServer) {
    console.log('[WebContainer] Server will restart on next mount');
  }

  console.log('[WebContainer] Reset complete');
}

/**
 * Check if WebContainer is ready to use
 */
export function isWebContainerReady(): boolean {
  return (
    webcontainerState.isMounted() &&
    webcontainerState.isInstalled() &&
    webcontainerState.isServerRunning()
  );
}

/**
 * Get current WebContainer status
 */
export function getWebContainerStatus(): {
  mounted: boolean;
  installed: boolean;
  serverRunning: boolean;
  serverUrl: string | null;
} {
  return {
    mounted: webcontainerState.isMounted(),
    installed: webcontainerState.isInstalled(),
    serverRunning: webcontainerState.isServerRunning(),
    serverUrl: webcontainerState.getServerUrl(),
  };
}
