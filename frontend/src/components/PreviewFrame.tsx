import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  webcontainer, 
  mountFiles, 
  installPackages, 
  startDevServer,
  webcontainerState 
} from '@/lib/webcontainer/exports';
import { createFilesHash } from '@/lib/webcontainer/files';

interface PreviewFrameProps {
  files: Array<{ path: string; content: string }>;
  onError?: (error: string) => void;
  onReady?: () => void;
}

export function PreviewFrame({ files, onError, onReady }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'mounting' | 'installing' | 'starting' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

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
        
        console.log('[PreviewFrame] Files hash comparison:', {
          currentHash: currentHash?.substring(0, 50) + '...',
          newHash: filesHash.substring(0, 50) + '...',
          isSame: currentHash === filesHash,
          filesCount: files.length
        });
        
        if (
          webcontainerState.isMounted() &&
          webcontainerState.isInstalled() &&
          webcontainerState.isServerRunning() &&
          currentHash === filesHash &&
          existingUrl
        ) {
          console.log('[PreviewFrame] Reusing existing WebContainer setup (files unchanged)');
          setPreviewUrl(existingUrl);
          setStatus('ready');
          onReady?.();
          return;
        }

        // Files have changed or need to initialize
        if (webcontainerState.isMounted() && currentHash !== filesHash) {
          console.log('[PreviewFrame] ⚡ Files changed! Updating WebContainer...');
        }

        // Need to initialize or update
        setStatus('mounting');
        setErrorMessage('');

        // Mount files (will update if hash is different)
        console.log('[PreviewFrame] Mounting/updating files...');
        await mountFiles(container, files);

        if (!mounted) return;

        setStatus('installing');

        // Install packages (will skip if already installed)
        console.log('[PreviewFrame] Installing packages...');
        const installResult = await installPackages(container);

        console.log('[PreviewFrame] npm install completed with exit code:', installResult.exitCode);

        if (installResult.exitCode !== 0) {
          throw new Error(`Package installation failed: ${installResult.output}`);
        }

        if (!mounted) {
          console.log('[PreviewFrame] Component unmounted, stopping initialization');
          return;
        }

        console.log('[PreviewFrame] Setting status to starting...');
        setStatus('starting');

        // Start dev server (will reuse if already running)
        console.log('[PreviewFrame] Starting dev server...');
        await startDevServer(container, (_port, url) => {
          console.log('[PreviewFrame] Server ready:', url);
          if (mounted) {
            setPreviewUrl(url);
            setStatus('ready');
            onReady?.();
          }
        });

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
            status === 'ready' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm text-gray-300">{getStatusMessage()}</span>
        </div>
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
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
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
