import { useEffect, useRef, useState } from 'react';
import { getAutoRefreshScript, createFilesHash } from '@/utils/vanillaPreviewRefresh';

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
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Create a hash of files to track changes using vanilla JS utility
  const filesHash = createFilesHash(files);

  useEffect(() => {
    try {
      // Force iframe refresh by updating key when files change
      console.log('[StaticHtmlPreview] Files changed, refreshing preview...');
      setIframeKey(prev => prev + 1);
      setIsReady(false);

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

      // Add auto-refresh script using vanilla JavaScript utility
      const errorHandlingScript = getAutoRefreshScript();
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${errorHandlingScript}\n</head>`);
      } else {
        html = `${errorHandlingScript}\n${html}`;
      }

      console.log('[StaticHtmlPreview] Generated HTML preview (hash:', filesHash.substring(0, 50), ')');
      setHtmlContent(html);
      setIsReady(true);

    } catch (error: any) {
      console.error('[StaticHtmlPreview] Error generating preview:', error);
      onError?.(error.message || 'Failed to generate preview');
    }
  }, [files, filesHash, onError]);

  // Listen for messages from iframe (vanilla JavaScript communication)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'preview-ready') {
        console.log('[StaticHtmlPreview] Preview loaded successfully at:', event.data.timestamp);
        onReady?.();
      } else if (event.data.type === 'preview-error') {
        console.error('[StaticHtmlPreview] Runtime error:', event.data.error);
        onError?.(event.data.error);
      } else if (event.data.type === 'preview-content-changed') {
        console.log('[StaticHtmlPreview] Content changed detected at:', event.data.timestamp);
        // Could trigger additional actions here if needed
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
      key={iframeKey}
      ref={iframeRef}
      srcDoc={htmlContent}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
      title="Static HTML Preview"
      style={{ backgroundColor: 'white' }}
    />
  );
}
