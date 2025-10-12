/**
 * Preview Error Capture Utility
 * Captures runtime errors, console errors, and build errors from the preview iframe
 */

export interface PreviewError {
  type: 'runtime' | 'console' | 'build' | 'network';
  message: string;
  stack?: string;
  timestamp: Date;
  file?: string;
  line?: number;
  column?: number;
}

export class PreviewErrorCapture {
  private errors: PreviewError[] = [];
  private errorCallbacks: Array<(error: PreviewError) => void> = [];
  private maxErrors = 50; // Limit stored errors

  constructor() {
    this.setupErrorListeners();
  }

  private setupErrorListeners() {
    // Listen for postMessage from iframe
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIframeMessage.bind(this));
    }
  }

  private handleIframeMessage(event: MessageEvent) {
    // Only accept messages from our preview iframe
    if (event.data && event.data.type === 'preview-error') {
      const error: PreviewError = {
        type: event.data.errorType || 'runtime',
        message: event.data.message,
        stack: event.data.stack,
        timestamp: new Date(),
        file: event.data.file,
        line: event.data.line,
        column: event.data.column,
      };

      this.addError(error);
    }
  }

  private addError(error: PreviewError) {
    // Add to error list
    this.errors.push(error);

    // Limit the number of stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify callbacks
    this.errorCallbacks.forEach(callback => callback(error));

    console.error('[PreviewErrorCapture]', error);
  }

  /**
   * Register a callback to be called when new errors are captured
   */
  onError(callback: (error: PreviewError) => void) {
    this.errorCallbacks.push(callback);
    
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get all captured errors
   */
  getErrors(): PreviewError[] {
    return [...this.errors];
  }

  /**
   * Get recent errors (last N)
   */
  getRecentErrors(count: number = 10): PreviewError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear all captured errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Format errors for sending to LLM
   */
  formatErrorsForLLM(): string {
    if (this.errors.length === 0) {
      return 'No errors detected in preview.';
    }

    let formatted = `🔴 PREVIEW ERRORS DETECTED (${this.errors.length} total):\n\n`;

    // Group errors by type
    const errorsByType = this.errors.reduce((acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = [];
      }
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, PreviewError[]>);

    // Format each type
    Object.entries(errorsByType).forEach(([type, errors]) => {
      formatted += `\n═══ ${type.toUpperCase()} ERRORS (${errors.length}) ═══\n`;
      
      errors.forEach((error, index) => {
        formatted += `\n${index + 1}. ${error.message}\n`;
        
        if (error.file) {
          formatted += `   File: ${error.file}`;
          if (error.line) formatted += `:${error.line}`;
          if (error.column) formatted += `:${error.column}`;
          formatted += '\n';
        }

        if (error.stack) {
          formatted += `   Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}\n`;
        }

        formatted += `   Time: ${error.timestamp.toLocaleTimeString()}\n`;
      });
    });

    formatted += '\n═══ END OF ERROR REPORT ═══\n';

    return formatted;
  }

  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(error => 
      error.type === 'runtime' || 
      error.type === 'build' ||
      error.message.toLowerCase().includes('cannot find module') ||
      error.message.toLowerCase().includes('failed to compile')
    );
  }

  /**
   * Get unique error messages (deduplicated)
   */
  getUniqueErrors(): PreviewError[] {
    const seen = new Set<string>();
    return this.errors.filter(error => {
      const key = `${error.type}:${error.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Clean up listeners
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleIframeMessage.bind(this));
    }
    this.errors = [];
    this.errorCallbacks = [];
  }
}

// Global singleton instance
let globalErrorCapture: PreviewErrorCapture | null = null;

export function getPreviewErrorCapture(): PreviewErrorCapture {
  if (!globalErrorCapture) {
    globalErrorCapture = new PreviewErrorCapture();
  }
  return globalErrorCapture;
}

/**
 * Script to inject into preview iframe to capture errors
 */
export const ERROR_CAPTURE_SCRIPT = `
(function() {
  // Capture runtime errors
  window.addEventListener('error', function(event) {
    window.parent.postMessage({
      type: 'preview-error',
      errorType: 'runtime',
      message: event.message,
      stack: event.error?.stack,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
    }, '*');
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    window.parent.postMessage({
      type: 'preview-error',
      errorType: 'runtime',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    }, '*');
  });

  // Intercept console.error
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    window.parent.postMessage({
      type: 'preview-error',
      errorType: 'console',
      message: message,
    }, '*');

    originalError.apply(console, args);
  };

  // Intercept console.warn for potential issues
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    
    // Only send critical warnings
    if (
      message.includes('Failed to') ||
      message.includes('Cannot') ||
      message.includes('Error') ||
      message.includes('deprecated')
    ) {
      window.parent.postMessage({
        type: 'preview-error',
        errorType: 'console',
        message: '[WARN] ' + message,
      }, '*');
    }

    originalWarn.apply(console, args);
  };

  // Monitor network errors
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(err => {
      window.parent.postMessage({
        type: 'preview-error',
        errorType: 'network',
        message: \`Network request failed: \${args[0]}\`,
        stack: err.stack,
      }, '*');
      throw err;
    });
  };

  console.log('[PreviewErrorCapture] Error capture initialized');
})();
`;
