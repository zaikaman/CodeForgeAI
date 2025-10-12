import { useEffect, useRef, useState, useMemo } from 'react';
import { webcontainer, mountFiles, installPackages, startDevServer } from '@/lib/webcontainer/exports';
import type { WebContainerProcess } from '@/lib/webcontainer/exports';

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
  const devServerProcessRef = useRef<WebContainerProcess | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  // Create stable hash of files to prevent infinite loops
  const filesHash = useMemo(() => {
    return JSON.stringify(files.map(f => ({ path: f.path, length: f.content.length })));
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
        setStatus('mounting');
        setErrorMessage('');

        const container = await webcontainer;

        if (!mounted) return;

        // Mount files
        console.log('[PreviewFrame] Mounting files...');
        await mountFiles(container, files);

        if (!mounted) return;

        setStatus('installing');

        // Install packages
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

        // Start dev server
        console.log('[PreviewFrame] Starting dev server...');
        const devServerProcess = await startDevServer(container, (_port, url) => {
          console.log('[PreviewFrame] Server ready:', url);
          if (mounted) {
            setPreviewUrl(url);
            setStatus('ready');
            onReady?.();
          }
        });

        devServerProcessRef.current = devServerProcess;

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
      // Kill dev server process when component unmounts
      if (devServerProcessRef.current) {
        devServerProcessRef.current.kill();
        devServerProcessRef.current = null;
      }
    };
  }, [filesHash]);

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
    <div className="preview-frame h-full w-full flex flex-col bg-gray-900">
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
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Open in new tab
          </a>
        )}
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
