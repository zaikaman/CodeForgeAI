import React from 'react';

interface FileTreeProps {
  files: Array<{ path: string; content: string }>;
  onSelectFile: (file: { path: string; content: string }) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile }) => {
  // Remove duplicate files (keep the last occurrence)
  const uniqueFiles = files.reduce((acc, file) => {
    const existingIndex = acc.findIndex(f => f.path === file.path);
    if (existingIndex !== -1) {
      acc[existingIndex] = file; // Replace with newer version
    } else {
      acc.push(file);
    }
    return acc;
  }, [] as Array<{ path: string; content: string }>);

  return (
    <div className="file-tree">
      <h4>File Structure</h4>
      <ul>
        {uniqueFiles.map((file, index) => (
          <li key={`${file.path}-${index}`} onClick={() => onSelectFile(file)}>
            {file.path}
          </li>
        ))}
      </ul>
    </div>
  );
};
