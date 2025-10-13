import React from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import './FileTree.css';

interface FileTreeProps {
  files: Array<{ path: string; content: string }>;
  onSelectFile: (file: { path: string; content: string }) => void;
  selectedFile?: { path: string; content: string } | null;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile, selectedFile }) => {
  const { playFileSelect, playToggle } = useSoundEffects();
  
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

  // Build tree structure from flat file list
  const buildTree = (files: Array<{ path: string; content: string }>): FileNode[] => {
    const root: FileNode[] = [];
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let currentLevel = root;
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const existingNode = currentLevel.find(node => node.name === part);
        
        if (existingNode) {
          if (!isFile && existingNode.children) {
            currentLevel = existingNode.children;
          }
        } else {
          const newNode: FileNode = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            content: isFile ? file.content : undefined,
          };
          
          currentLevel.push(newNode);
          
          if (!isFile && newNode.children) {
            currentLevel = newNode.children;
          }
        }
      });
    });
    
    return root;
  };

  const tree = buildTree(uniqueFiles);

  const TreeNode: React.FC<{ node: FileNode; level: number }> = ({ node, level }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const isSelected = selectedFile?.path === node.path;

    const handleClick = () => {
      if (node.type === 'folder') {
        playToggle();
        setIsExpanded(!isExpanded);
      } else {
        playFileSelect();
        onSelectFile({ path: node.path, content: node.content || '' });
      }
    };

    return (
      <div className="tree-node">
        <div 
          className={`tree-node-label ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 12}px` }}
          onClick={handleClick}
        >
          {node.type === 'folder' ? (
            <>
              <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
              <span className="node-name">{node.name}</span>
            </>
          ) : (
            <>
              <span className="file-icon">📄</span>
              <span className="node-name">{node.name}</span>
            </>
          )}
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="tree-node-children">
            {node.children.map((child, index) => (
              <TreeNode key={`${child.path}-${index}`} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-tree-list">
      {tree.map((node, index) => (
        <TreeNode key={`${node.path}-${index}`} node={node} level={0} />
      ))}
    </div>
  );
};
