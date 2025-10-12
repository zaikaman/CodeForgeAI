import { useState } from 'react';
import { PreviewFrame } from './PreviewFrame';
import { DeployButton } from './DeployButton';

interface ProjectWorkspaceProps {
  projectId: string;
  files: Array<{ path: string; content: string }>;
  onPreviewReady?: () => void;
  onDeployComplete?: (url: string) => void;
}

export function ProjectWorkspace({
  projectId,
  files,
  onPreviewReady,
  onDeployComplete,
}: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewReady, setPreviewReady] = useState(false);

  const handlePreviewReady = () => {
    setPreviewReady(true);
    onPreviewReady?.();
  };

  return (
    <div className="project-workspace h-full flex flex-col bg-gray-900">
      {/* Header with tabs and actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${
                activeTab === 'preview'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
            `}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${
                activeTab === 'code'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
            `}
          >
            Code
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Deploy button - only show when preview is ready */}
          {previewReady && (
            <DeployButton
              projectId={projectId}
              files={files}
              onDeployComplete={onDeployComplete}
            />
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <PreviewFrame
            files={files}
            onReady={handlePreviewReady}
            onError={(error) => console.error('Preview error:', error)}
          />
        ) : (
          <div className="h-full p-4 overflow-auto bg-gray-900">
            <div className="space-y-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
                    <span className="text-sm font-mono text-gray-300">{file.path}</span>
                  </div>
                  <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                    <code>{file.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
