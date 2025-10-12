export type { WebContainer, WebContainerProcess, FileSystemTree } from '@webcontainer/api';

// Re-export WebContainer module
export { webcontainer, webcontainerContext, WORK_DIR } from './index';

// Re-export file utilities
export { convertToFileSystemTree, mountFiles, writeFile, readFile, deleteFile, createDirectory } from './files';

// Re-export process utilities
export { runCommand, installPackages, startDevServer, buildProject } from './process';
export type { ProcessResult } from './process';
