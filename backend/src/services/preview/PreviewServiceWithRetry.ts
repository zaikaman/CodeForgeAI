import { spawn } from 'child_process';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
import { generateDockerfile, detectLanguageFromFiles } from './DockerfileTemplates';

export interface DeploymentResult {
  success: boolean;
  previewUrl?: string;
  error?: string;
  logs?: string;
  attempt?: number;
}

export interface IPreviewServiceWithRetry {
  generatePreviewWithRetry(
    generationId: string, 
    files: Array<{ path: string; content: string }>,
    maxRetries?: number
  ): Promise<DeploymentResult>;
}

export class PreviewServiceWithRetry implements IPreviewServiceWithRetry {
  private flyApiToken: string;
  private maxRetries: number;

  constructor(maxRetries: number = 3) {
    if (!process.env.FLY_API_TOKEN) {
      throw new Error('FLY_API_TOKEN environment variable is not set.');
    }
    this.flyApiToken = process.env.FLY_API_TOKEN;
    this.maxRetries = maxRetries;
  }

  /**
   * Generate preview with automatic retry mechanism
   * If deployment fails, it will:
   * 1. Capture the error logs
   * 2. Send them to ChatAgent to fix the issues
   * 3. Retry deployment with fixed code
   * 4. Repeat up to maxRetries times
   */
  async generatePreviewWithRetry(
    generationId: string, 
    files: Array<{ path: string; content: string }>,
    maxRetries?: number
  ): Promise<DeploymentResult> {
    const retries = maxRetries ?? this.maxRetries;
    let currentFiles = files;
    let lastError: string = '';
    let lastLogs: string = '';

    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`\n=== Deployment Attempt ${attempt}/${retries} ===`);
      
      try {
        const result = await this.attemptDeployment(generationId, currentFiles, attempt);
        
        if (result.success) {
          console.log(`✓ Deployment successful on attempt ${attempt}`);
          return {
            ...result,
            attempt
          };
        }

        // Deployment failed, capture error details
        lastError = result.error || 'Unknown deployment error';
        lastLogs = result.logs || '';
        
        console.log(`✗ Deployment failed on attempt ${attempt}`);
        console.log(`Error: ${lastError}`);

        // If this was the last attempt, return the failure
        if (attempt >= retries) {
          console.log(`Maximum retry attempts (${retries}) reached. Giving up.`);
          return {
            success: false,
            error: lastError,
            logs: lastLogs,
            attempt
          };
        }

        // Try to fix the code using ChatAgent
        console.log(`\n→ Sending error logs to ChatAgent for fixes...`);
        const fixedFiles = await this.fixCodeWithAgent(currentFiles, lastError, lastLogs, attempt);
        
        if (!fixedFiles || fixedFiles.length === 0) {
          console.log(`✗ ChatAgent could not provide fixes. Stopping retry.`);
          return {
            success: false,
            error: `ChatAgent could not fix the issues after attempt ${attempt}`,
            logs: lastLogs,
            attempt
          };
        }

        console.log(`✓ ChatAgent provided fixes. Retrying deployment...`);
        currentFiles = fixedFiles;

      } catch (error: any) {
        lastError = error.message || 'Unexpected error during deployment';
        lastLogs = error.stack || '';
        
        console.error(`✗ Unexpected error on attempt ${attempt}:`, error);

        if (attempt >= retries) {
          return {
            success: false,
            error: lastError,
            logs: lastLogs,
            attempt
          };
        }

        // Try to fix even unexpected errors
        try {
          console.log(`\n��� Attempting to fix unexpected error with ChatAgent...`);
          const fixedFiles = await this.fixCodeWithAgent(currentFiles, lastError, lastLogs, attempt);
          if (fixedFiles && fixedFiles.length > 0) {
            currentFiles = fixedFiles;
          } else {
            return {
              success: false,
              error: lastError,
              logs: lastLogs,
              attempt
            };
          }
        } catch (fixError) {
          console.error(`✗ Failed to get fixes from ChatAgent:`, fixError);
          return {
            success: false,
            error: lastError,
            logs: lastLogs,
            attempt
          };
        }
      }
    }

    // Should not reach here, but just in case
    return {
      success: false,
      error: lastError || 'Deployment failed after all retries',
      logs: lastLogs,
      attempt: retries
    };
  }

  /**
   * Attempt a single deployment
   */
  private async attemptDeployment(
    generationId: string,
    files: Array<{ path: string; content: string }>,
    attempt: number
  ): Promise<DeploymentResult> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const appName = `preview-${generationId.replace(/_/g, "-")}`.toLowerCase();

    try {
      // 1. Detect language from files
      const language = detectLanguageFromFiles(files);
      console.log(`[Attempt ${attempt}] Detected language: ${language} for generation ${generationId}`);

      // 2. Write files to temp directory
      for (const file of files) {
        const filePath = path.join(tmpDir.name, file.path);
        const dirName = path.dirname(filePath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }

      // 3. Create Dockerfile based on detected language
      const dockerfileContent = generateDockerfile(files);
      fs.writeFileSync(path.join(tmpDir.name, 'Dockerfile'), dockerfileContent);

      // 4. Create a fly.toml file
      const flyTomlContent = this.createFlyToml(appName, language);
      fs.writeFileSync(path.join(tmpDir.name, 'fly.toml'), flyTomlContent);

      // 5. Deploy using flyctl
      await this.deployWithFlyctl(tmpDir.name, appName);

      // 6. Verify deployment by checking logs
      const verificationLogs = await this.getDeploymentLogs(appName);
      
      return {
        success: true,
        previewUrl: `https://${appName}.fly.dev`,
        logs: verificationLogs
      };

    } catch (error: any) {
      // Capture deployment logs for debugging
      let logs = error.deploymentLogs || '';
      
      // If no deployment logs in error, try to fetch them
      if (!logs) {
        try {
          logs = await this.getDeploymentLogs(appName);
        } catch (logError) {
          console.warn('Could not retrieve deployment logs:', logError);
        }
      }

      // If still no logs, use error stack
      if (!logs) {
        logs = error.stack || '';
      }

      console.log(`Captured deployment logs (${logs.length} characters)`);

      return {
        success: false,
        error: error.message,
        logs: logs
      };
    } finally {
      tmpDir.removeCallback();
    }
  }

  /**
   * Use ChatAgent to fix code based on deployment errors
   */
  private async fixCodeWithAgent(
    currentFiles: Array<{ path: string; content: string }>,
    error: string,
    logs: string,
    attempt: number
  ): Promise<Array<{ path: string; content: string }> | null> {
    try {
      console.log('→ Initializing ChatAgent...');
      const { runner } = await ChatAgent();

      const filesContext = currentFiles.map(f => 
        `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
      ).join('\n\n');

      const fixPrompt = `The deployment to Fly.io FAILED on attempt ${attempt}. Please analyze the error and fix the code.

DEPLOYMENT ERROR:
${error}

DEPLOYMENT LOGS:
${logs}

CURRENT CODEBASE:
${filesContext}

Please:
1. Analyze the error and logs carefully
2. Identify what's causing the deployment to fail
3. Fix the issues in the code (could be missing dependencies, incorrect configuration, build errors, etc.)
4. Return ALL files (both modified and unmodified) so we have a complete working codebase
5. Provide a summary of what you fixed

Common issues to check:
- Missing package.json or incorrect dependencies
- Build script errors
- Port configuration issues
- Missing environment variables
- Dockerfile issues
- File path problems

Return the complete fixed codebase.`;

      console.log('→ Sending fix request to ChatAgent...');
      console.log(`   Prompt length: ${fixPrompt.length} characters`);
      console.log(`   Files to fix: ${currentFiles.length}`);

      // Add timeout to prevent hanging
      const timeoutMs = 240000; // 4 minutes
      const responsePromise = runner.ask(fixPrompt);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('ChatAgent timeout after 2 minutes')), timeoutMs)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]) as any;

      console.log('→ ChatAgent response received');
      console.log(`   Response type: ${typeof response}`);
      console.log(`   Response keys: ${response ? Object.keys(response).join(', ') : 'null'}`);

      if (!response) {
        console.error('✗ ChatAgent returned null/undefined response');
        return null;
      }

      if (!response.files) {
        console.error('✗ ChatAgent response missing "files" property');
        console.error(`   Full response: ${JSON.stringify(response, null, 2)}`);
        return null;
      }

      if (!Array.isArray(response.files)) {
        console.error('✗ ChatAgent response.files is not an array');
        console.error(`   Type: ${typeof response.files}`);
        return null;
      }

      if (response.files.length === 0) {
        console.warn('⚠ ChatAgent returned empty files array');
        return null;
      }

      console.log(`✓ ChatAgent fixed ${response.files.length} files`);
      if (response.summary) {
        console.log(`   Summary: ${response.summary}`);
      }

      // Validate file structure
      for (const file of response.files) {
        if (!file.path || !file.content) {
          console.error(`✗ Invalid file structure: ${JSON.stringify(file)}`);
          return null;
        }
      }

      return response.files;

    } catch (error: any) {
      console.error('✗ Error getting fixes from ChatAgent:');
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Error message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack trace: ${error.stack}`);
      }
      return null;
    }
  }

  /**
   * Get deployment logs from Fly.io
   */
  private async getDeploymentLogs(appName: string): Promise<string> {
    try {
      const result = await this.runCommand(
        'flyctl',
        ['logs', '--app', appName, '--no-tail'],
        process.cwd()
      );

      if (result.code === 0) {
        return result.stdout;
      } else {
        return `Failed to retrieve logs: ${result.stderr}`;
      }
    } catch (error: any) {
      return `Error retrieving logs: ${error.message}`;
    }
  }

  private runCommand(command: string, args: string[], workDir: string): Promise<{ code: number | null, stdout: string, stderr: string }> {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: workDir,
            env: { ...process.env, FLY_API_TOKEN: this.flyApiToken },
            shell: false,
            windowsHide: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`${command} stdout: ${output}`);
            stdout += output;
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            console.error(`${command} stderr: ${output}`);
            stderr += output;
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });
    });
  }

  private async deployWithFlyctl(workDir: string, appName: string): Promise<void> {
    // Check if app already exists
    const listResult = await this.runCommand('flyctl', ['apps', 'list', '--json'], workDir);
    
    let appExists = false;
    if (listResult.code === 0 && listResult.stdout) {
      try {
        const apps = JSON.parse(listResult.stdout);
        appExists = apps.some((app: any) => app.Name === appName);
      } catch (e) {
        console.warn('Failed to parse flyctl apps list output, will attempt to create app');
      }
    }

    // Only create app if it doesn't exist
    if (!appExists) {
      console.log(`Creating new Fly.io app: ${appName}`);
      const createResult = await this.runCommand('flyctl', ['apps', 'create', appName, '--org', 'personal'], workDir);

      if (createResult.code !== 0) {
        // Check if error is because app already exists (race condition or parsing failure)
        const errorMsg = createResult.stderr.toLowerCase();
        if (!errorMsg.includes('already') && !errorMsg.includes('taken')) {
          throw new Error(`flyctl apps create failed with code ${createResult.code}: ${createResult.stderr}`);
        }
        console.log(`App ${appName} already exists, proceeding with deployment`);
      }
    } else {
      console.log(`App ${appName} already exists, updating deployment`);
    }

    // Deploy (this will update existing app or deploy new one)
    const deployResult = await this.runCommand('flyctl', ['deploy', '--remote-only'], workDir);

    if (deployResult.code !== 0) {
        // Create a detailed error with both stdout and stderr
        const error: any = new Error(`flyctl deploy failed with code ${deployResult.code}`);
        error.deploymentLogs = deployResult.stderr + '\n' + deployResult.stdout;
        throw error;
    }
  }

  private createFlyToml(appName: string, language: string): string {
    // Determine internal port based on language
    const internalPort = language === 'python' ? 8080 : 80;
    
    return `app = "${appName}"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = ${internalPort}
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
`;
  }
}
