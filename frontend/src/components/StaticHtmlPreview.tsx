import { useEffect, useRef, useState } from 'react';

interface StaticHtmlPreviewProps {
  files: Array<{ path: string; content: string }>;
  onError?: (error: string) => void;
  onReady?: () => void;
}

/**
 * Simple preview component for static HTML/CSS/JS projects
 * Uses srcdoc to render directly in iframe without WebContainer
 */
export function StaticHtmlPreview({ files, onError, onReady }: StaticHtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Find HTML, CSS, and JS files
      const htmlFile = files.find(f => f.path === 'index.html' || f.path.endsWith('.html'));
      const cssFile = files.find(f => f.path === 'styles.css' || f.path === 'style.css' || f.path.endsWith('.css'));
      const jsFile = files.find(f => f.path === 'scripts.js' || f.path === 'script.js' || f.path.endsWith('.js'));

      if (!htmlFile) {
        onError?.('No HTML file found');
        return;
      }

      let html = htmlFile.content;

      // Inject CSS if found
      if (cssFile) {
        const cssTag = `<style>\n${cssFile.content}\n</style>`;
        
        // Try to inject in <head> if exists, otherwise before </body>
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${cssTag}\n</head>`);
        } else if (html.includes('</body>')) {
          html = html.replace('</body>', `${cssTag}\n</body>`);
        } else {
          html = `${cssTag}\n${html}`;
        }
      }

      // Inject JS if found
      if (jsFile) {
        const jsTag = `<script>\n${jsFile.content}\n</script>`;
        
        // Inject before </body> if exists, otherwise at the end
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${jsTag}\n</body>`);
        } else {
          html = `${html}\n${jsTag}`;
        }
      }

      // Add base tag to ensure relative URLs work
      const baseTag = '<base target="_blank">';
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${baseTag}`);
      } else {
        html = `${baseTag}\n${html}`;
      }

      // Add error handling script
      const errorHandlingScript = `
        <script>
          window.addEventListener('error', function(e) {
            console.error('Preview Error:', e.error || e.message);
            window.parent.postMessage({
              type: 'preview-error',
              error: e.error ? e.error.toString() : e.message
            }, '*');
          });
          
          window.addEventListener('load', function() {
            window.parent.postMessage({ type: 'preview-ready' }, '*');
          });
        </script>
      `;
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${errorHandlingScript}\n</head>`);
      } else {
        html = `${errorHandlingScript}\n${html}`;
      }

      console.log('[StaticHtmlPreview] Generated HTML preview');
      setHtmlContent(html);
      setIsReady(true);

    } catch (error: any) {
      console.error('[StaticHtmlPreview] Error generating preview:', error);
      onError?.(error.message || 'Failed to generate preview');
    }
  }, [files, onError]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'preview-ready') {
        console.log('[StaticHtmlPreview] Preview loaded successfully');
        onReady?.();
      } else if (event.data.type === 'preview-error') {
        console.error('[StaticHtmlPreview] Runtime error:', event.data.error);
        onError?.(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onError]);

  if (!isReady || !htmlContent) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Preparing preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-frame h-full w-full flex flex-col bg-gray-900 ${
      isEnlarged ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-300">Ready</span>
        </div>
        <div className="flex items-center gap-2">
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
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          title="Static HTML Preview"
          style={{ backgroundColor: 'white' }}
        />
      </div>
    </div>
  );
}
