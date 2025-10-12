export type { WebContainer, WebContainerProcess, FileSystemTree } from '@webcontainer/api';

// Re-export WebContainer module
export { webcontainer, webcontainerContext, WORK_DIR } from './index';

// Re-export file utilities
export { convertToFileSystemTree, mountFiles, writeFile, readFile, deleteFile, createDirectory, createFilesHash } from './files';

// Re-export process utilities
export { runCommand, installPackages, startDevServer, buildProject } from './process';
export type { ProcessResult } from './process';

// Re-export state management
export { webcontainerState } from './state';
export type { WebContainerState } from './state';

// Re-export utility functions
export { resetWebContainer, isWebContainerReady, getWebContainerStatus } from './reset';

// Re-export hooks
export { useWebContainerStatus, useWebContainerReady, usePreviewUrl } from './hooks';
