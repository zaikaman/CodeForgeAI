import type { WebContainer, FileSystemTree } from '@webcontainer/api';
import { webcontainerState } from './state';

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
 * Create a hash of files for change detection
 */
export function createFilesHash(files: Array<{ path: string; content: string }>): string {
  return JSON.stringify(
    files
      .map(f => ({ path: f.path, hash: simpleHash(f.content) }))
      .sort((a, b) => a.path.localeCompare(b.path))
  );
}

/**
 * Simple hash function for content comparison
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Mount files to WebContainer with state tracking
 */
export async function mountFiles(
  container: WebContainer,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  const filesHash = createFilesHash(files);
  
  // Check if same files are already mounted
  if (webcontainerState.isMounted() && webcontainerState.getCurrentFilesHash() === filesHash) {
    console.log('[WebContainer] Files already mounted, skipping...');
    return;
  }

  // If files already mounted but changed, update them instead of remounting
  if (webcontainerState.isMounted() && webcontainerState.getCurrentFilesHash() !== filesHash) {
    console.log('[WebContainer] Files changed, updating...');
    // Note: onUpdateComplete callback should be passed from caller if needed
    await updateFiles(container, files);
    webcontainerState.setCurrentFilesHash(filesHash);
    return;
  }

  const tree = convertToFileSystemTree(files);
  console.log('[WebContainer] Mounting files:', Object.keys(tree));
  await container.mount(tree);
  
  webcontainerState.setMounted(true);
  webcontainerState.setCurrentFilesHash(filesHash);
}

/**
 * Update existing files in WebContainer without remounting
 */
export async function updateFiles(
  container: WebContainer,
  files: Array<{ path: string; content: string }>,
  onUpdateComplete?: () => void
): Promise<void> {
  console.log('[WebContainer] ⚡ Updating files in WebContainer...');
  console.log(`[WebContainer] Files to update: ${files.length}`);
  
  let updatedCount = 0;
  for (const file of files) {
    try {
      await writeFile(container, file.path, file.content);
      updatedCount++;
    } catch (error) {
      console.error(`[WebContainer] ❌ Failed to update file ${file.path}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  console.log(`[WebContainer] ✅ Files updated successfully (${updatedCount}/${files.length})`);
  
  // Callback to trigger refresh after update
  if (onUpdateComplete) {
    console.log('[WebContainer] Triggering update complete callback...');
    onUpdateComplete();
  }
  
  // Note: Dev server should auto-reload when files change via HMR
  // But we also provide a callback to force refresh if needed
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
