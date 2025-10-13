/**
 * Vanilla JavaScript utilities for refreshing preview frames
 * This provides pure JavaScript logic without React dependencies
 */

/**
 * Send a refresh command to a preview iframe
 * @param iframeElement - The iframe element to refresh
 */
export function refreshPreviewIframe(iframeElement: HTMLIFrameElement): void {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.warn('[VanillaRefresh] Invalid iframe element');
    return;
  }

  try {
    // Send refresh message to iframe's vanilla JavaScript listener
    iframeElement.contentWindow.postMessage(
      { type: 'refresh-preview' },
      '*'
    );
    console.log('[VanillaRefresh] Refresh command sent to iframe');
  } catch (error) {
    console.error('[VanillaRefresh] Failed to send refresh command:', error);
  }
}

/**
 * Force reload an iframe by updating its src attribute
 * @param iframeElement - The iframe element to reload
 */
export function forceReloadIframe(iframeElement: HTMLIFrameElement): void {
  if (!iframeElement) {
    console.warn('[VanillaRefresh] Invalid iframe element');
    return;
  }

  try {
    const currentSrc = iframeElement.src;
    
    // For srcdoc iframes, we need to trigger re-render differently
    if (iframeElement.srcdoc) {
      // Store current srcdoc
      const currentContent = iframeElement.srcdoc;
      // Clear it
      iframeElement.srcdoc = '';
      // Restore it to force re-render
      setTimeout(() => {
        iframeElement.srcdoc = currentContent;
      }, 50);
      console.log('[VanillaRefresh] srcdoc iframe reloaded');
    } else if (currentSrc) {
      // For regular src iframes, add timestamp to bust cache
      const separator = currentSrc.includes('?') ? '&' : '?';
      iframeElement.src = `${currentSrc}${separator}_t=${Date.now()}`;
      console.log('[VanillaRefresh] src iframe reloaded with cache bust');
    }
  } catch (error) {
    console.error('[VanillaRefresh] Failed to reload iframe:', error);
  }
}

/**
 * Setup auto-refresh for preview frames when code changes
 * This is pure vanilla JavaScript that can be injected into any HTML
 * @returns The JavaScript code as a string to inject
 */
export function getAutoRefreshScript(): string {
  return `
    <script>
      (function() {
        'use strict';
        
        // Vanilla JavaScript auto-refresh logic
        console.log('[AutoRefresh] Preview refresh script initialized');
        
        // Track last known content hash
        let lastContentHash = '';
        
        // Simple hash function for content
        function hashCode(str) {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          return hash.toString();
        }
        
        // Check if content has changed
        function checkContentChange() {
          const currentContent = document.documentElement.outerHTML;
          const currentHash = hashCode(currentContent);
          
          if (lastContentHash && lastContentHash !== currentHash) {
            console.log('[AutoRefresh] Content changed detected, notifying parent');
            window.parent.postMessage({
              type: 'preview-content-changed',
              timestamp: new Date().toISOString()
            }, '*');
          }
          
          lastContentHash = currentHash;
        }
        
        // Listen for messages from parent window
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'refresh-preview') {
            console.log('[AutoRefresh] Refresh command received');
            window.location.reload();
          } else if (event.data && event.data.type === 'check-content') {
            checkContentChange();
          }
        });
        
        // Monitor DOM changes (optional, can be heavy)
        if (window.MutationObserver) {
          const observer = new MutationObserver(function(mutations) {
            // Debounce notifications
            clearTimeout(window._refreshDebounce);
            window._refreshDebounce = setTimeout(checkContentChange, 500);
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
          });
          
          console.log('[AutoRefresh] MutationObserver active');
        }
        
        // Notify parent when loaded
        window.addEventListener('load', function() {
          console.log('[AutoRefresh] Preview loaded');
          window.parent.postMessage({
            type: 'preview-ready',
            timestamp: new Date().toISOString()
          }, '*');
          checkContentChange();
        });
        
        // Handle errors
        window.addEventListener('error', function(e) {
          console.error('[AutoRefresh] Error:', e.error || e.message);
          window.parent.postMessage({
            type: 'preview-error',
            error: e.error ? e.error.toString() : e.message,
            timestamp: new Date().toISOString()
          }, '*');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
          console.error('[AutoRefresh] Unhandled rejection:', e.reason);
          window.parent.postMessage({
            type: 'preview-error',
            error: 'Unhandled Promise Rejection: ' + (e.reason || 'Unknown'),
            timestamp: new Date().toISOString()
          }, '*');
        });
      })();
    </script>
  `;
}

/**
 * Create a file change detector for vanilla JavaScript projects
 * @param files - Array of file objects with path and content
 * @returns Hash string representing the current state
 */
export function createFilesHash(files: Array<{ path: string; content: string }>): string {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const hashInput = sortedFiles
    .map(f => `${f.path}:${f.content.length}:${f.content.substring(0, 100)}`)
    .join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return hash.toString(36);
}

/**
 * Inject refresh logic into HTML content
 * @param html - Original HTML content
 * @returns HTML with refresh logic injected
 */
export function injectRefreshLogic(html: string): string {
  const refreshScript = getAutoRefreshScript();
  
  // Try to inject in <head> if exists
  if (html.includes('</head>')) {
    return html.replace('</head>', `${refreshScript}\n</head>`);
  }
  
  // Otherwise inject at the start
  return refreshScript + '\n' + html;
}
