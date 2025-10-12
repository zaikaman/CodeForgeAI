import { PreviewFrame } from './PreviewFrame';

interface ProjectWorkspaceProps {
  files: Array<{ path: string; content: string }>;
  onPreviewReady?: () => void;
}

export function ProjectWorkspace({
  files,
  onPreviewReady,
}: ProjectWorkspaceProps) {
  const handlePreviewReady = () => {
    onPreviewReady?.();
  };

  return (
    <div className="project-workspace h-full flex flex-col bg-gray-900">
      {/* Content area - always show preview */}
      <div className="flex-1 overflow-hidden">
        <PreviewFrame
          files={files}
          onReady={handlePreviewReady}
          onError={(error) => console.error('Preview error:', error)}
        />
      </div>
    </div>
  );
}
