import { PreviewFrame } from './PreviewFrame';
import { usePreviewErrorFix } from '@/hooks/usePreviewErrorFix';
import { useState } from 'react';

interface ProjectWorkspaceProps {
  files: Array<{ path: string; content: string }>;
  generationId: string;
  language: string;
  onPreviewReady?: () => void;
  onFilesUpdated?: (files: Array<{ path: string; content: string }>) => void;
  autoFixErrors?: boolean;
}

export function ProjectWorkspace({
  files,
  generationId,
  language,
  onPreviewReady,
  onFilesUpdated,
  autoFixErrors = false,
}: ProjectWorkspaceProps) {
  const [displayFiles, setDisplayFiles] = useState(files);

  const errorFix = usePreviewErrorFix({
    generationId,
    currentFiles: displayFiles,
    language,
    autoFix: autoFixErrors,
    debounceMs: 3000, // Wait 3 seconds before attempting fix
    onFixStart: () => {
      console.log('[ProjectWorkspace] Auto-fix started...');
    },
    onFixComplete: (fixedFiles) => {
      console.log('[ProjectWorkspace] Auto-fix completed, updating files...');
      // Merge fixed files with existing files
      const updatedFiles = [...displayFiles];
      fixedFiles.forEach(fixedFile => {
        const index = updatedFiles.findIndex(f => f.path === fixedFile.path);
        if (index >= 0) {
          updatedFiles[index] = fixedFile;
        } else {
          updatedFiles.push(fixedFile);
        }
      });
      setDisplayFiles(updatedFiles);
      onFilesUpdated?.(updatedFiles);
    },
    onFixError: (error) => {
      console.error('[ProjectWorkspace] Auto-fix failed:', error);
    },
  });

  const handlePreviewReady = () => {
    onPreviewReady?.();
  };

  // Update display files when props change
  useState(() => {
    setDisplayFiles(files);
  });

  return (
    <div className="project-workspace h-full flex flex-col bg-gray-900">
      {/* Error fix indicator */}
      {errorFix.isFixing && (
        <div className="px-4 py-2 bg-blue-900/50 border-b border-blue-700 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-300">
            🔧 Attempting to fix {errorFix.errorCount} error{errorFix.errorCount > 1 ? 's' : ''}...
            (Attempt #{errorFix.fixAttempts})
          </span>
        </div>
      )}

      {/* Content area - always show preview */}
      <div className="flex-1 overflow-hidden">
        <PreviewFrame
          files={displayFiles}
          onReady={handlePreviewReady}
          onError={(error) => console.error('Preview error:', error)}
          onPreviewError={(errors) => {
            console.log('[ProjectWorkspace] Preview errors detected:', errors.length);
            errorFix.handlePreviewErrors(errors);
          }}
        />
      </div>

      {/* Manual fix button (shown when auto-fix is disabled) */}
      {!autoFixErrors && errorFix.errorCount > 0 && !errorFix.isFixing && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-700 flex items-center justify-between">
          <span className="text-sm text-red-300">
            ⚠️ {errorFix.errorCount} error{errorFix.errorCount > 1 ? 's' : ''} detected in preview
          </span>
          <button
            onClick={() => errorFix.attemptFix()}
            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            🔧 Attempt Fix
          </button>
        </div>
      )}
    </div>
  );
}
