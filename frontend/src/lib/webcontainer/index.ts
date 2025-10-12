import { WebContainer } from '@webcontainer/api';

// Working directory name - must be a simple folder name, not a path
const WORK_DIR = 'project';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
};

export let webcontainer: Promise<WebContainer>;

// Only initialize in browser (not SSR)
if (typeof window !== 'undefined') {
  webcontainer = Promise.resolve()
    .then(() => {
      console.log('[WebContainer] Booting...');
      return WebContainer.boot({
        coep: 'credentialless',
        workdirName: WORK_DIR,
        forwardPreviewErrors: true,
      });
    })
    .then((container) => {
      webcontainerContext.loaded = true;
      console.log('[WebContainer] Booted successfully');

      // Listen for preview errors
      container.on('preview-message', (message) => {
        console.log('[WebContainer] Preview message:', message);

        if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
          const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
          const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
          
          console.error(`[WebContainer] ${title}:`, {
            message: 'message' in message ? message.message : 'Unknown error',
            pathname: message.pathname,
            port: message.port,
            stack: message.stack,
          });
        }
      });

      return container;
    })
    .catch((error) => {
      console.error('[WebContainer] Failed to boot:', error);
      throw error;
    });
} else {
  // SSR fallback
  webcontainer = new Promise(() => {
    // noop for SSR
  });
}

export { WORK_DIR };
