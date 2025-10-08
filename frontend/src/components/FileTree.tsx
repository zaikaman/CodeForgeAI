import React from 'react';

interface FileTreeProps {
  files: Array<{ path: string; content: string }>;
  onSelectFile: (file: { path: string; content: string }) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile }) => {
  return (
    <div className="file-tree">
      <h4>File Structure</h4>
      <ul>
        {files.map((file) => (
          <li key={file.path} onClick={() => onSelectFile(file)}>
            {file.path}
          </li>
        ))}
      </ul>
    </div>
  );
};
