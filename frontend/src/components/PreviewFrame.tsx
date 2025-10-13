import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  webcontainer, 
  mountFiles, 
  installPackages, 
  startDevServer,
  webcontainerState,
  resetWebContainer
} from '@/lib/webcontainer/exports';
import { createFilesHash } from '@/lib/webcontainer/files';
import { getPreviewErrorCapture, PreviewError } from '@/utils/previewErrorCapture';
import { StaticHtmlPreview } from './StaticHtmlPreview';

interface PreviewFrameProps {
  files: Array<{ path: string; content: string }>;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPreviewError?: (errors: PreviewError[]) => void;
}

export function PreviewFrame({ files, onError, onReady, onPreviewError }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'mounting' | 'installing' | 'starting' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const [previewErrors, setPreviewErrors] = useState<PreviewError[]>([]);
  const [iframeKey, setIframeKey] = useState<number>(0); // Key to force iframe refresh
  const [forceReloadTimestamp, setForceReloadTimestamp] = useState<number>(0); // Timestamp for cache busting

  // Setup error capture
  useEffect(() => {
    const errorCapture = getPreviewErrorCapture();
    
    // Clear previous errors when files change
    errorCapture.clearErrors();
    setPreviewErrors([]);

    // Listen for new errors
    const unsubscribe = errorCapture.onError((error) => {
      console.log('[PreviewFrame] Preview error captured:', error);
      setPreviewErrors(prev => [...prev, error]);
      
      // Notify parent component
      const allErrors = errorCapture.getErrors();
      onPreviewError?.(allErrors);
    });

    return () => {
      unsubscribe();
    };
  }, [onPreviewError]);

  // Hard refresh function - forces complete reload with cache busting
  const hardRefreshIframe = () => {
    console.log('[PreviewFrame] 🔥 HARD REFRESH triggered - forcing complete reload');
    
    // Method 1: Try to communicate with iframe to clear its cache
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Send message to clear cache and service workers
        iframeRef.current.contentWindow.postMessage({ 
          type: 'hard-refresh',
          clearCache: true,
          clearStorage: true 
        }, '*');
        
        console.log('[PreviewFrame] Sent hard-refresh message to iframe');
      } catch (e) {
        console.warn('[PreviewFrame] Could not send message to iframe:', e);
      }
    }
    
    // Method 2: Add timestamp to force cache busting
    setForceReloadTimestamp(Date.now());
    
    // Method 3: Update iframe key to unmount and remount (most aggressive)
    setTimeout(() => {
      setIframeKey(prev => prev + 1);
    }, 100);
    
    // Method 4: Try to force reload the iframe after remount
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.location.reload();
        } catch (e) {
          console.warn('[PreviewFrame] Could not reload iframe:', e);
        }
      }
    }, 300);
  };

  // Listen for refresh events from WebContainer state
  useEffect(() => {
    const unsubscribe = webcontainerState.onRefresh(() => {
      console.log('[PreviewFrame] Refresh triggered by WebContainer state');
      hardRefreshIframe();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Detect if this is a static HTML project early
  const isStaticHtml = useMemo(() => {
    const hasIndexHtml = files.some(f => f.path === 'index.html' || f.path.endsWith('.html'));
    const hasPackageJson = files.some(f => f.path === 'package.json');
    const isStatic = hasIndexHtml && !hasPackageJson;
    
    console.log('[PreviewFrame] Project type detection:', {
      hasIndexHtml,
      hasPackageJson,
      isStatic
    });
    
    return isStatic;
  }, [files]);

  // If static HTML, use simple preview component (no WebContainer needed)
  if (isStaticHtml) {
    console.log('[PreviewFrame] Using StaticHtmlPreview for vanilla HTML project');
    return (
      <StaticHtmlPreview 
        files={files} 
        onError={onError} 
        onReady={onReady}
      />
    );
  }

  // Create a stable hash of files to detect changes
  // This ensures useEffect runs when files actually change
  const filesHash = useMemo(() => {
    const hash = createFilesHash(files);
    console.log('[PreviewFrame] Files hash computed:', {
      hash: hash.substring(0, 50) + '...',
      filesCount: files.length
    });
    return hash;
  }, [files]);

  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('[PreviewFrame] Already initializing, skipping...');
      return;
    }

    let mounted = true;

    const initializePreview = async () => {
      try {
        if (!files || files.length === 0) {
          setStatus('idle');
          return;
        }

        isInitializingRef.current = true;

        const container = await webcontainer;
        if (!mounted) return;

        // Check if we can reuse existing setup
        const filesHash = createFilesHash(files);
        const existingUrl = webcontainerState.getServerUrl();
        const currentHash = webcontainerState.getCurrentFilesHash();
        
        if (
          webcontainerState.isMounted() &&
          webcontainerState.isInstalled() &&
          webcontainerState.isServerRunning() &&
          currentHash === filesHash &&
          existingUrl
        ) {
          // Reuse existing setup silently (files unchanged)
          setPreviewUrl(existingUrl);
          setStatus('ready');
          onReady?.();
          return;
        }

        // Files have changed or need to initialize
        const filesChanged = currentHash !== filesHash;
        if (filesChanged) {
          console.log('[PreviewFrame] ⚡ Files changed! Updating WebContainer...');
        } else {
          console.log('[PreviewFrame] Initializing WebContainer for the first time...');
        }

        // Need to initialize or update
        setStatus('mounting');
        setErrorMessage('');

        // Mount files (will update if hash is different)
        await mountFiles(container, files);
        
        // Force HARD iframe refresh when files change
        if (filesChanged && webcontainerState.isServerRunning()) {
          console.log('[PreviewFrame] 🔄 Forcing HARD iframe refresh due to file changes...');
          // Small delay to ensure files are written before refresh
          setTimeout(() => {
            hardRefreshIframe();
          }, 500);
        }

        if (!mounted) return;

        setStatus('installing');

        // Install packages (will skip if already installed)
        console.log('[PreviewFrame] Installing packages...');
        const installResult = await installPackages(container);

        console.log('[PreviewFrame] npm install completed with exit code:', installResult.exitCode);

        if (installResult.exitCode !== 0) {
          const installError = `Package installation failed: ${installResult.output}`;
          console.error('[PreviewFrame] npm install failed:', installError);
          
          // Add to error capture system for auto-fix
          const errorCapture = getPreviewErrorCapture();
          errorCapture.addError({
            type: 'build',
            message: installError,
            timestamp: new Date(),
          });
          
          // Notify parent to trigger auto-fix
          const allErrors = errorCapture.getErrors();
          onPreviewError?.(allErrors);
          
          // Set error state but don't throw - let auto-fix handle it
          setErrorMessage(installError);
          setStatus('error');
          return;
        }

        if (!mounted) {
          console.log('[PreviewFrame] Component unmounted, stopping initialization');
          return;
        }

        console.log('[PreviewFrame] Setting status to starting...');
        setStatus('starting');

        // Start dev server (will reuse if already running)
        console.log('[PreviewFrame] Starting dev server...');
        await startDevServer(
          container, 
          (_port, url) => {
            console.log('[PreviewFrame] Server ready:', url);
            if (mounted) {
              setPreviewUrl(url);
              setStatus('ready');
              onReady?.();
            }
          },
          (buildError) => {
            console.error('[PreviewFrame] Build error from dev server:', buildError);
            if (mounted) {
              const errorCapture = getPreviewErrorCapture();
              errorCapture.addError({
                type: 'build',
                message: buildError,
                timestamp: new Date(),
              });
              
              // Notify parent
              const allErrors = errorCapture.getErrors();
              onPreviewError?.(allErrors);
            }
          }
        );

      } catch (error) {
        console.error('[PreviewFrame] Error:', error);
        if (mounted) {
          const message = error instanceof Error ? error.message : 'Unknown error occurred';
          setErrorMessage(message);
          setStatus('error');
          onError?.(message);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializePreview();

    return () => {
      mounted = false;
      isInitializingRef.current = false;
      // Don't kill server on unmount - keep it running for reuse
    };
  }, [filesHash, files, onError, onReady]); // filesHash ensures we detect file changes

  const getStatusMessage = () => {
    switch (status) {
      case 'idle':
        return 'Waiting for files...';
      case 'mounting':
        return 'Mounting files...';
      case 'installing':
        return 'Installing dependencies...';
      case 'starting':
        return 'Starting development server...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  return (
    <div className={`preview-frame h-full w-full flex flex-col bg-gray-900 ${
      isEnlarged ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'ready' ? (previewErrors.length > 0 ? 'bg-orange-500' : 'bg-green-500') :
            status === 'error' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm text-gray-300">{getStatusMessage()}</span>
          {previewErrors.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
              {previewErrors.length} error{previewErrors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Button - Always available when ready */}
          {status === 'ready' && previewUrl && (
            <button
              onClick={() => {
                console.log('[PreviewFrame] Manual HARD refresh triggered');
                hardRefreshIframe();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-300 hover:text-blue-100 bg-blue-900/50 hover:bg-blue-900/70 rounded-md transition-colors"
              title="Hard refresh preview (clears cache)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          )}
          {/* Clear Cache Button - show when error or cache issues */}
          {(status === 'error' || previewErrors.length > 0) && (
            <button
              onClick={async () => {
                setStatus('idle');
                setErrorMessage('');
                await resetWebContainer({ clearFiles: true });
                // Trigger re-initialization by updating files hash
                window.location.reload();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-300 hover:text-orange-100 bg-orange-900/50 hover:bg-orange-900/70 rounded-md transition-colors"
              title="Clear cache and restart preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear Cache</span>
            </button>
          )}
          <button
            onClick={() => setIsEnlarged(!isEnlarged)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            title={isEnlarged ? "Exit enlarged view" : "Enlarge preview"}
          >
            {isEnlarged ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Exit</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Enlarge</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        {status === 'error' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
            <div className="max-w-md p-4 bg-gray-800 rounded-lg border border-red-500">
              <h3 className="text-red-400 font-semibold mb-2">Preview Error</h3>
              <p className="text-sm text-gray-300">{errorMessage}</p>
            </div>
          </div>
        ) : status === 'ready' && previewUrl ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={`${previewUrl}${forceReloadTimestamp ? `?t=${forceReloadTimestamp}` : ''}`}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
            allow="cross-origin-isolated"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-400">{getStatusMessage()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
