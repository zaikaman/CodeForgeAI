import type { WebContainer, WebContainerProcess } from '@webcontainer/api';

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
 * Install npm packages
 */
export async function installPackages(container: WebContainer): Promise<ProcessResult> {
  console.log('[WebContainer] Installing npm packages...');
  return await runCommand(container, 'npm', ['install']);
}

/**
 * Start development server
 */
export async function startDevServer(
  container: WebContainer,
  onReady?: (port: number, url: string) => void
): Promise<WebContainerProcess> {
  console.log('[WebContainer] Starting dev server...');

  // Listen for server-ready event
  if (onReady) {
    container.on('server-ready', (port, url) => {
      console.log(`[WebContainer] Server ready on port ${port}: ${url}`);
      onReady(port, url);
    });
  }

  // Start dev server in background
  const process = await container.spawn('npm', ['run', 'dev']);

  return process;
}

/**
 * Build project
 */
export async function buildProject(container: WebContainer): Promise<ProcessResult> {
  console.log('[WebContainer] Building project...');
  return await runCommand(container, 'npm', ['run', 'build']);
}
