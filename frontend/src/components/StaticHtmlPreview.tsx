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
    <iframe
      ref={iframeRef}
      srcDoc={htmlContent}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
      title="Static HTML Preview"
      style={{ backgroundColor: 'white' }}
    />
  );
}
