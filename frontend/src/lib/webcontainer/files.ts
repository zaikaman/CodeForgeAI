import type { WebContainer, FileSystemTree } from '@webcontainer/api';

/**
 * Convert file structure to WebContainer FileSystemTree format
 */
export function convertToFileSystemTree(files: Array<{ path: string; content: string }>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current: any = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        // File
        current[part] = {
          file: {
            contents: file.content,
          },
        };
      } else {
        // Directory
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    }
  }

  return tree;
}

/**
 * Mount files to WebContainer
 */
export async function mountFiles(
  container: WebContainer,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  const tree = convertToFileSystemTree(files);
  console.log('[WebContainer] Mounting files:', Object.keys(tree));
  await container.mount(tree);
}

/**
 * Write a single file to WebContainer
 */
export async function writeFile(
  container: WebContainer,
  path: string,
  content: string
): Promise<void> {
  console.log('[WebContainer] Writing file:', path);
  await container.fs.writeFile(path, content);
}

/**
 * Read a file from WebContainer
 */
export async function readFile(container: WebContainer, path: string): Promise<string> {
  console.log('[WebContainer] Reading file:', path);
  return await container.fs.readFile(path, 'utf-8');
}

/**
 * Delete a file from WebContainer
 */
export async function deleteFile(container: WebContainer, path: string): Promise<void> {
  console.log('[WebContainer] Deleting file:', path);
  await container.fs.rm(path);
}

/**
 * Create a directory in WebContainer
 */
export async function createDirectory(container: WebContainer, path: string): Promise<void> {
  console.log('[WebContainer] Creating directory:', path);
  await container.fs.mkdir(path, { recursive: true });
}
