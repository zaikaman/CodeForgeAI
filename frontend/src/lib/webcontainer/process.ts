import type { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { webcontainerState } from './state';

export interface ProcessResult {
  exitCode: number;
  output: string;
}

/**
 * Run a command in WebContainer and return the result
 */
export async function runCommand(
  container: WebContainer,
  command: string,
  args: string[] = []
): Promise<ProcessResult> {
  console.log(`[WebContainer] Running command: ${command} ${args.join(' ')}`);

  const process = await container.spawn(command, args);

  let output = '';

  // Capture stdout using pipeTo with WritableStream (recommended by WebContainer docs)
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        output += data;
        // Filter out ANSI escape codes and spinner characters for cleaner logs
        const cleanValue = data
          .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape codes
          .replace(/[\|\/\-\\]/g, '') // Remove spinner characters
          .trim();
        
        // Only log meaningful output (not just whitespace or escape codes)
        if (cleanValue.length > 0) {
          console.log(`[WebContainer] ${cleanValue}`);
        }
      }
    })
  );

  console.log(`[WebContainer] Waiting for command to exit...`);
  const exitCode = await process.exit;
  console.log(`[WebContainer] Command exited with code: ${exitCode}`);

  return { exitCode, output };
}

/**
 * Install npm packages with state tracking
 */
export async function installPackages(container: WebContainer): Promise<ProcessResult> {
  // Check if packages are already installed
  if (webcontainerState.isInstalled()) {
    console.log('[WebContainer] Packages already installed, skipping...');
    return { exitCode: 0, output: 'Packages already installed' };
  }

  console.log('[WebContainer] Installing npm packages...');
  const result = await runCommand(container, 'npm', ['install']);
  
  if (result.exitCode === 0) {
    webcontainerState.setInstalled(true);
  }
  
  return result;
}

/**
 * Start development server with state tracking
 */
export async function startDevServer(
  container: WebContainer,
  onReady?: (port: number, url: string) => void,
  onError?: (error: string) => void
): Promise<WebContainerProcess> {
  // Check if server is already running
  const existingProcess = webcontainerState.getServerProcess();
  const existingUrl = webcontainerState.getServerUrl();
  
  if (existingProcess && existingUrl) {
    console.log('[WebContainer] Server already running at:', existingUrl);
    // Call onReady immediately with existing URL
    if (onReady) {
      const port = parseInt(existingUrl.match(/:(\d+)/)?.[1] || '3000', 10);
      onReady(port, existingUrl);
    }
    return existingProcess;
  }

  console.log('[WebContainer] Starting dev server...');

  // Listen for server-ready event
  if (onReady) {
    container.on('server-ready', (port, url) => {
      console.log(`[WebContainer] Server ready on port ${port}: ${url}`);
      webcontainerState.setServerUrl(url);
      onReady(port, url);
    });
  }

  // Start dev server in background
  const process = await container.spawn('npm', ['run', 'dev']);
  
  // Capture output to detect errors
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        // Look for error patterns in the output
        const errorPatterns = [
          /error/i,
          /failed to compile/i,
          /cannot find module/i,
          /module not found/i,
          /syntax error/i,
          /unexpected token/i,
          /\.tsx?:\d+:\d+.*error/i, // TypeScript errors
        ];
        
        const hasError = errorPatterns.some(pattern => pattern.test(data));
        
        if (hasError && onError) {
          // Clean up ANSI codes for cleaner error messages
          const cleanError = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
          console.error('[WebContainer] Build error detected:', cleanError);
          onError(cleanError);
        }
        
        // Log all output for debugging
        console.log('[WebContainer Dev]', data);
      }
    })
  );
  
  webcontainerState.setServerProcess(process);

  return process;
}

/**
 * Build project
 */
export async function buildProject(container: WebContainer): Promise<ProcessResult> {
  console.log('[WebContainer] Building project...');
  return await runCommand(container, 'npm', ['run', 'build']);
}
