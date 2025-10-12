/**
 * ErrorFixNotification Component
 * Shows toast-style notifications for error detection and fixing
 */

import { useEffect, useState } from 'react';
import { PreviewError } from '@/utils/previewErrorCapture';

interface ErrorFixNotificationProps {
  errors: PreviewError[];
  isFixing: boolean;
  onDismiss?: () => void;
  onManualFix?: () => void;
}

export function ErrorFixNotification({
  errors,
  isFixing,
  onDismiss,
  onManualFix,
}: ErrorFixNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (errors.length > 0 || isFixing) {
      setIsVisible(true);
      return;
    }
    
    // Delay hiding to allow animation
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, [errors.length, isFixing]);

  if (!isVisible) return null;

  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, PreviewError[]>);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
          isFixing ? 'bg-blue-900/50 border-b border-blue-700' :
          'bg-red-900/50 border-b border-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {isFixing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-blue-300">
                  🔧 Fixing Errors...
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-red-300">
                  Preview Errors Detected
                </span>
              </>
            )}
          </div>
          {!isFixing && onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3 max-h-64 overflow-y-auto">
          {isFixing ? (
            <div className="text-sm text-gray-300">
              <p className="mb-2">
                The AI is analyzing and fixing the detected errors...
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span>This may take a few moments</span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-300 mb-3">
                {errors.length} error{errors.length > 1 ? 's' : ''} found in preview:
              </div>

              {/* Error Groups */}
              <div className="space-y-2">
                {Object.entries(errorsByType).map(([type, typeErrors]) => (
                  <div key={type} className="bg-gray-900/50 rounded p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-orange-400 uppercase">
                        {type}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({typeErrors.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {typeErrors.slice(0, 2).map((error, idx) => (
                        <div key={idx} className="text-xs text-gray-400">
                          • {error.message.substring(0, 80)}
                          {error.message.length > 80 ? '...' : ''}
                        </div>
                      ))}
                      {typeErrors.length > 2 && (
                        <div className="text-xs text-gray-500 italic">
                          + {typeErrors.length - 2} more...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isFixing && onManualFix && (
          <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700 flex gap-2">
            <button
              onClick={onManualFix}
              className="flex-1 px-3 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              🔧 Fix Automatically
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
