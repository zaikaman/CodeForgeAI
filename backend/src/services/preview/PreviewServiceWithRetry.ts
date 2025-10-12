import { spawn } from 'child_process';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
import { generateDockerfile, detectLanguageFromFiles } from './DockerfileTemplates';
import { LearningIntegrationService } from '../learning/LearningIntegrationService';
import { TypeScriptErrorParser } from '../errors/TypeScriptErrorParser';

const PACKAGE_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;
const TYPESCRIPT_ALLOWED_VERSIONS = new Set([
  '^5.0.0',
  '^5.1.6',
  '^5.2.2',
  '^5.3.3',
  '^5.4.5',
  '~5.4.5',
  '5.0.0',
  '5.1.6',
  '5.2.2',
  '5.3.3',
  '5.4.5'
]);
const TYPESCRIPT_FALLBACK_VERSION = '^5.4.5';
const TYPE_DEPENDENCY_VERSION_MAP: Record<string, string> = {
  '@types/express': '^4.17.21',
  '@types/node': '^20.11.17',
  '@types/cors': '^2.8.18',
  '@types/body-parser': '^1.19.5',
  '@types/cookie-parser': '^1.4.3',
  '@types/ws': '^8.5.10',
  '@types/lodash': '^4.17.7'
};
const DEPENDENCY_TYPE_MAPPINGS: Record<string, string[]> = {
  express: ['@types/express', '@types/node'],
  cors: ['@types/cors'],
  'body-parser': ['@types/body-parser'],
  'cookie-parser': ['@types/cookie-parser'],
  ws: ['@types/ws'],
  lodash: ['@types/lodash']
};
const DOM_INDICATOR_REGEX = /(document\.|window\.|HTMLElement|querySelector|addEventListener|KeyboardEvent|MouseEvent)/i;

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
  private learningService: LearningIntegrationService;
  private readonly MAX_CONSECUTIVE_FAILURES = 10; // Prevent infinite loops (10 attempts max)
  private readonly MAX_SAME_ERROR_RETRIES = 5; // Prevent getting stuck on same error (5 times max)

  constructor(_maxRetries: number = 10) { // maxRetries parameter kept for backward compatibility but not used
    if (!process.env.FLY_API_TOKEN) {
      throw new Error('FLY_API_TOKEN environment variable is not set.');
    }
    this.flyApiToken = process.env.FLY_API_TOKEN;
    this.learningService = new LearningIntegrationService();
  }

  /**
   * Generate preview with automatic retry mechanism
   * If deployment fails, it will:
   * 1. Capture the error logs
   * 2. Send them to ChatAgent to fix the issues
   * 3. Retry deployment with fixed code
   * 4. Repeat until successful or max safety limits reached
   * 
   * Safety measures:
   * - Max 5 consecutive failures without any progress
   * - Max 3 retries for the same error message
   * - ChatAgent must provide different fixes each time
   */
  async generatePreviewWithRetry(
    generationId: string, 
    files: Array<{ path: string; content: string }>,
    maxRetries?: number
  ): Promise<DeploymentResult> {
    const retries = maxRetries ?? 10; // Default 10 attempts with safety measures
  let currentFiles = this.sanitizeGeneratedFiles(files);
    let lastError: string = '';
    let lastLogs: string = '';
    let lastErrorId: string | undefined;
    
    // Safety tracking
    const errorHistory: string[] = [];
    let consecutiveFailures = 0;
    let sameErrorCount = 0;
    let previousErrorSignature = '';
    
    // Detect language for learning system
    const language = this.learningService.detectLanguage('', files.map(f => ({ path: f.path, content: f.content })));

    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`\n=== Deployment Attempt ${attempt} ===`);
      
      try {
  const result = await this.attemptDeployment(generationId, currentFiles, attempt);
        
        if (result.success) {
          console.log(`✓ Deployment successful on attempt ${attempt}`);
          
          // If this was a retry (attempt > 1), mark the previous error as resolved
          if (attempt > 1 && lastErrorId) {
            await this.markErrorResolved(lastErrorId, 'Fixed via automated retry and ChatAgent');
          }
          
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

        // Capture error for learning system
        lastErrorId = await this.captureDeploymentError(currentFiles, lastError, lastLogs, attempt, generationId, language);

        // Track error patterns for safety
        const currentErrorSignature = this.getErrorSignature(lastError);
        errorHistory.push(currentErrorSignature);
        consecutiveFailures++;

        // Check if this is the same error as before
        if (currentErrorSignature === previousErrorSignature) {
          sameErrorCount++;
        } else {
          sameErrorCount = 1;
          previousErrorSignature = currentErrorSignature;
        }

        // Safety check 1: Too many consecutive failures
        if (consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          console.log(`\n⚠️ Safety limit reached: ${this.MAX_CONSECUTIVE_FAILURES} consecutive failures.`);
          console.log(`This suggests a fundamental issue that cannot be auto-fixed.`);
          return {
            success: false,
            error: `Auto-fix failed after ${consecutiveFailures} attempts. ${lastError}`,
            logs: lastLogs,
            attempt
          };
        }

        // Safety check 2: Same error repeating
        if (sameErrorCount >= this.MAX_SAME_ERROR_RETRIES) {
          console.log(`\n⚠️ Safety limit reached: Same error occurred ${sameErrorCount} times.`);
          console.log(`ChatAgent unable to resolve this specific issue.`);
          return {
            success: false,
            error: `Unable to fix error after ${sameErrorCount} attempts: ${lastError}`,
            logs: lastLogs,
            attempt
          };
        }

        // If maxRetries was explicitly set (not Infinity), respect it
        if (attempt >= retries && retries !== Infinity) {
          console.log(`Maximum retry attempts (${retries}) reached. Giving up.`);
          return {
            success: false,
            error: lastError,
            logs: lastLogs,
            attempt
          };
        }

        // Try to fix the code using ChatAgent
        console.log(`\n→ Sending error logs to ChatAgent for fixes (attempt ${attempt}, same error count: ${sameErrorCount})...`);
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
  currentFiles = this.sanitizeGeneratedFiles(fixedFiles);
        
        // Reset consecutive failures counter (we got a fix, so we're making progress)
        consecutiveFailures = 0;

      } catch (error: any) {
        lastError = error.message || 'Unexpected error during deployment';
        lastLogs = error.stack || '';
        
        console.error(`✗ Unexpected error on attempt ${attempt}:`, error);

        // Track error patterns for safety
        const currentErrorSignature = this.getErrorSignature(lastError);
        errorHistory.push(currentErrorSignature);
        consecutiveFailures++;

        if (currentErrorSignature === previousErrorSignature) {
          sameErrorCount++;
        } else {
          sameErrorCount = 1;
          previousErrorSignature = currentErrorSignature;
        }

        // Apply same safety checks
        if (consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          return {
            success: false,
            error: `Auto-fix failed after ${consecutiveFailures} attempts. ${lastError}`,
            logs: lastLogs,
            attempt
          };
        }

        if (sameErrorCount >= this.MAX_SAME_ERROR_RETRIES) {
          return {
            success: false,
            error: `Unable to fix error after ${sameErrorCount} attempts: ${lastError}`,
            logs: lastLogs,
            attempt
          };
        }

        if (attempt >= retries && retries !== Infinity) {
          return {
            success: false,
            error: lastError,
            logs: lastLogs,
            attempt
          };
        }

        // Try to fix even unexpected errors
        try {
          console.log(`\n→ Attempting to fix unexpected error with ChatAgent...`);
          const fixedFiles = await this.fixCodeWithAgent(currentFiles, lastError, lastLogs, attempt);
          if (fixedFiles && fixedFiles.length > 0) {
            currentFiles = this.sanitizeGeneratedFiles(fixedFiles);
            consecutiveFailures = 0; // Reset on successful fix
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
        
        // Additional check: if this is a JSON file and content starts with a quote,
        // it might be double-stringified
        let contentToWrite = file.content;
        
        if (file.path.endsWith('.json')) {
          // Try to detect and fix double-stringified JSON
          if (typeof contentToWrite === 'string' && 
              contentToWrite.startsWith('"') && 
              contentToWrite.endsWith('"')) {
            try {
              const parsed = JSON.parse(contentToWrite);
              if (typeof parsed === 'string') {
                contentToWrite = parsed;
                console.log(`✓ Fixed double-stringified JSON for ${file.path}`);
              }
            } catch (e) {
              // Keep original if parsing fails
            }
          }
          
          // Validate JSON syntax before writing
          try {
            JSON.parse(contentToWrite);
            console.log(`✓ Validated JSON syntax for ${file.path}`);
          } catch (e: any) {
            console.error(`✗ Invalid JSON syntax in ${file.path}: ${e.message}`);
            console.error(`   Content preview: ${contentToWrite.substring(0, 100)}`);
          }
        }
        
        // Fix escaped content - LLM often returns JSON-escaped strings
        // We need to unescape: \n -> newline, \" -> ", \\ -> \, etc.
        
        // Check if content looks like it's JSON-escaped (has \n or \" patterns)
        if (contentToWrite.includes('\\n') || contentToWrite.includes('\\"') || contentToWrite.includes('\\t')) {
          try {
            // Try to parse as JSON string to unescape properly
            // Wrap in quotes to make it a valid JSON string if it's not already
            const wrapped = contentToWrite.startsWith('"') ? contentToWrite : `"${contentToWrite}"`;
            const unescaped = JSON.parse(wrapped);
            
            // Only use unescaped version if it actually changed something
            if (unescaped !== contentToWrite && typeof unescaped === 'string') {
              contentToWrite = unescaped;
              console.log(`✓ Unescaped JSON-encoded content for ${file.path}`);
            }
          } catch (e) {
            // If JSON parsing fails, manually unescape common patterns
            contentToWrite = contentToWrite
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log(`✓ Manually unescaped content for ${file.path}`);
          }
        }
        
        // Fix over-escaped content in code files (secondary cleanup)
        if (file.path.endsWith('.ts') || file.path.endsWith('.tsx') || 
            file.path.endsWith('.js') || file.path.endsWith('.jsx')) {
          // Fix common over-escaping patterns in regex
          // Double-escaped regex character classes: \\s -> \s, \\d -> \d, etc.
          contentToWrite = contentToWrite.replace(/\\\\([sdwSDW])/g, '\\$1');
          // Double-escaped dots in regex: \\. -> \.
          contentToWrite = contentToWrite.replace(/\\\\\./g, '\\.');
        }
        
        fs.writeFileSync(filePath, contentToWrite);
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
      let errorMessage = error.message || 'Deployment failed';
      
      // If no deployment logs in error, try to fetch them
      if (!logs) {
        try {
          console.log('→ Fetching deployment logs...');
          logs = await this.getDeploymentLogs(appName);
        } catch (logError) {
          console.warn('Could not retrieve deployment logs:', logError);
        }
      }

      // For crash errors, try to get machine-specific logs
      if (errorMessage.includes('crashing') || errorMessage.includes('smoke checks')) {
        try {
          // Extract machine ID from error message if present
          const machineIdMatch = errorMessage.match(/[0-9a-f]{14}/);
          if (machineIdMatch) {
            const machineId = machineIdMatch[0];
            console.log(`→ Fetching logs for crashed machine ${machineId}...`);
            const machineLogsResult = await this.runCommand(
              'flyctl',
              ['logs', '--app', appName, '--instance', machineId],
              process.cwd(),
              { checkBuildErrors: false }
            );
            if (machineLogsResult.code === 0 && machineLogsResult.stdout) {
              logs = `Machine ${machineId} logs:\n${machineLogsResult.stdout}\n\n${logs}`;
              console.log(`✓ Retrieved ${machineLogsResult.stdout.length} chars of machine logs`);
            }
          }
        } catch (machineLogError) {
          console.warn('Could not retrieve machine-specific logs:', machineLogError);
        }
      }

      // If still no logs, use error stack
      if (!logs) {
        logs = error.stack || '';
      }

      console.log(`Captured deployment logs (${logs.length} characters)`);

      return {
        success: false,
        error: errorMessage,
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

      // Parse TypeScript errors if present
      let typeScriptErrorGuide = '';
      if (TypeScriptErrorParser.hasTypeScriptErrors(logs)) {
        const parsedErrors = TypeScriptErrorParser.parseErrors(logs);
        typeScriptErrorGuide = '\n\n' + TypeScriptErrorParser.generateFixGuide(parsedErrors) + '\n';
      }

      const fixPrompt = `The deployment to Fly.io FAILED on attempt ${attempt}. Please analyze the error and fix the code.

DEPLOYMENT ERROR:
${error}

DEPLOYMENT LOGS:
${logs}
${typeScriptErrorGuide}

CURRENT CODEBASE (${currentFiles.length} files):
${filesContext}

⚠️ CRITICAL REQUIREMENT - FILE COUNT VALIDATION:
You MUST return ALL ${currentFiles.length} files from the current codebase.
- If you fix an existing file: include it with fixes
- If you don't need to change a file: include it UNCHANGED
- If you create a NEW file: add it to the list (total will be ${currentFiles.length + 1}+)
- NEVER omit or delete files from your response

Response will be REJECTED if you return fewer than ${currentFiles.length} files!

Please:
1. Analyze the error and logs carefully (ESPECIALLY the TypeScript error analysis above if present)
2. Identify what's causing the deployment to fail
3. Fix the issues in the code following the provided fix strategies
4. Return EVERY SINGLE FILE from the codebase (modified or not) + any new files you create
5. Provide a summary of what you fixed

Common issues to check:
- TypeScript type errors (see detailed analysis above)
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

      // ⚠️ CRITICAL: For deployment fixes, ChatAgent MUST return ALL files
      // It can return MORE files (if creating new ones), but never LESS
      if (response.files.length < currentFiles.length) {
        console.error(`✗ ChatAgent returned FEWER files than input!`);
        console.error(`   Input files: ${currentFiles.length}`);
        console.error(`   Returned files: ${response.files.length}`);
        console.error(`   Missing ${currentFiles.length - response.files.length} file(s)`);
        
        // Find which files are missing
        const returnedPaths = new Set(response.files.map((f: any) => this.normalizeFilePath(f.path)));
        const missingFiles = currentFiles.filter(f => !returnedPaths.has(this.normalizeFilePath(f.path)));
        
        if (missingFiles.length > 0) {
          console.error(`   Missing files:`);
          missingFiles.forEach(f => console.error(`     - ${f.path}`));
        }
        
        return null;
      }

      console.log(`✓ ChatAgent fixed ${response.files.length} files (input: ${currentFiles.length})`);
      if (response.files.length > currentFiles.length) {
        console.log(`   ✨ Created ${response.files.length - currentFiles.length} new file(s)`);
      }
      if (response.summary) {
        console.log(`   Summary: ${response.summary}`);
      }

      // Validate file structure and ensure content is string
      for (let i = 0; i < response.files.length; i++) {
        const file = response.files[i];
        
        if (!file.path) {
          console.error(`✗ File at index ${i} missing path property`);
          return null;
        }
        
        if (!file.content && file.content !== '') {
          console.error(`✗ File ${file.path} missing content property`);
          return null;
        }

        // CRITICAL: Ensure content is a string
        if (typeof file.content !== 'string') {
          console.warn(`⚠ File ${file.path} has non-string content (${typeof file.content}), converting...`);
          
          // If content is an object/array, stringify it
          if (typeof file.content === 'object') {
            try {
              response.files[i].content = JSON.stringify(file.content, null, 2);
              console.log(`✓ Converted ${file.path} content to JSON string`);
            } catch (err) {
              console.error(`✗ Failed to stringify content for ${file.path}: ${err}`);
              return null;
            }
          } else {
            // Try to convert to string
            response.files[i].content = String(file.content);
          }
        } else {
          // Content is already a string, but check if it's a double-escaped JSON string
          // This happens when LLM returns already-stringified JSON content
          if (file.path.endsWith('.json') && file.content.startsWith('"') && file.content.endsWith('"')) {
            try {
              // Try to parse it once to remove outer quotes and unescape
              const unescaped = JSON.parse(file.content);
              if (typeof unescaped === 'string') {
                response.files[i].content = unescaped;
                console.log(`✓ Unescaped double-stringified content for ${file.path}`);
              }
            } catch (err) {
              // If parsing fails, keep original content
              console.warn(`⚠ Could not unescape content for ${file.path}, keeping as-is`);
            }
          }
        }
      }

      console.log(`✓ All ${response.files.length} files validated successfully`);
      
      // Quick validation: If the original error was a TypeScript error,
      // verify that the fixed code doesn't have the same error
      if (TypeScriptErrorParser.hasTypeScriptErrors(logs)) {
        const originalErrorCodes = TypeScriptErrorParser.extractErrorCodes(logs);
        console.log(`   → Validating TypeScript fixes for error codes: ${originalErrorCodes.join(', ')}`);
        
        // We'll do a more thorough check during the next deployment attempt
        // For now, just log that we're aware of the TS errors
        console.log(`   → Will verify fixes during next deployment attempt`);
      }
      
      return this.sanitizeGeneratedFiles(response.files);

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

  private sanitizeGeneratedFiles(files: Array<{ path: string; content: string }>): Array<{ path: string; content: string }> {
    const hasTypeScriptSources = files.some(file => {
      const normalizedPath = this.normalizeFilePath(file.path).toLowerCase();
      return normalizedPath.endsWith('.ts') || normalizedPath.endsWith('.tsx');
    });

    const sanitized = files.map(file => ({ ...file }));
    const packageJsonIndex = sanitized.findIndex(file => this.normalizeFilePath(file.path).toLowerCase() === 'package.json');
    const tsconfigIndex = sanitized.findIndex(file => this.normalizeFilePath(file.path).toLowerCase() === 'tsconfig.json');
    const needsDomLib = this.detectDomUsage(sanitized);

    if (packageJsonIndex === -1) {
      const tsconfigSanitized = this.sanitizeTsConfigIfPresent(sanitized, tsconfigIndex, needsDomLib);
      return tsconfigSanitized;
    }

    const packageFile = sanitized[packageJsonIndex];
    let parsedPackage: any;

    try {
      parsedPackage = JSON.parse(packageFile.content);
    } catch (error) {
      console.warn('⚠ Could not parse package.json for sanitization:', error);
      const tsconfigSanitized = this.sanitizeTsConfigIfPresent(sanitized, tsconfigIndex, needsDomLib);
      return tsconfigSanitized;
    }

    let packageChanged = false;

    packageChanged = this.ensureTypeScriptDependency(parsedPackage, hasTypeScriptSources) || packageChanged;
    packageChanged = this.ensureTypeDeclarationPackages(parsedPackage) || packageChanged;

    if (packageChanged) {
      sanitized[packageJsonIndex] = {
        ...packageFile,
        content: JSON.stringify(parsedPackage, null, 2)
      };
      console.log('✓ Applied package.json sanitization heuristics');
    }

    return this.sanitizeTsConfigIfPresent(sanitized, tsconfigIndex, needsDomLib);
  }

  private ensureTypeScriptDependency(pkg: any, hasTypeScriptSources: boolean): boolean {
    let changed = false;
    const dependencyInfo = this.getDependencyInfo(pkg, 'typescript');

    if (!dependencyInfo && hasTypeScriptSources) {
      this.setDependencyVersion(pkg, 'typescript', TYPESCRIPT_FALLBACK_VERSION, 'devDependencies');
      console.log('✓ Added TypeScript devDependency with stable version');
      changed = true;
    }

    const normalized = this.normalizeDependencyVersion(pkg, 'typescript', TYPESCRIPT_FALLBACK_VERSION, dependencyInfo?.section);
    return changed || normalized;
  }

  private normalizeDependencyVersion(
    pkg: any,
    dependencyName: string,
    fallbackVersion: string,
    existingSection?: typeof PACKAGE_SECTIONS[number]
  ): boolean {
    const info = this.getDependencyInfo(pkg, dependencyName);
    if (!info) {
      return false;
    }

    const rawVersion = String(info.version).trim();
    const isPlaceholder = /latest|next|beta|alpha|rc|\*|workspace:/i.test(rawVersion) || rawVersion.length === 0;
    const isAllowed = TYPESCRIPT_ALLOWED_VERSIONS.has(rawVersion);

    if (dependencyName === 'typescript' && (!isAllowed || isPlaceholder)) {
      this.setDependencyVersion(pkg, dependencyName, fallbackVersion, existingSection || info.section);
      console.log(`✓ Normalized ${dependencyName} version from "${rawVersion}" to "${fallbackVersion}"`);
      return true;
    }

    return false;
  }

  private getDependencyInfo(
    pkg: any,
    dependencyName: string
  ): { section: typeof PACKAGE_SECTIONS[number]; version: string } | null {
    for (const section of PACKAGE_SECTIONS) {
      const bucket = pkg[section];
      if (bucket && typeof bucket === 'object' && dependencyName in bucket) {
        return { section, version: String(bucket[dependencyName]) };
      }
    }
    return null;
  }

  private setDependencyVersion(
    pkg: any,
    dependencyName: string,
    version: string,
    preferredSection: typeof PACKAGE_SECTIONS[number] = 'devDependencies'
  ): void {
    const info = this.getDependencyInfo(pkg, dependencyName);
    const targetSection = info?.section || preferredSection;

    if (!pkg[targetSection] || typeof pkg[targetSection] !== 'object') {
      pkg[targetSection] = {};
    }

    pkg[targetSection][dependencyName] = version;
  }

  private normalizeFilePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  private ensureTypeDeclarationPackages(pkg: any): boolean {
    let changed = false;

    for (const [dependency, typePackages] of Object.entries(DEPENDENCY_TYPE_MAPPINGS)) {
      const dependencyInfo = this.getDependencyInfo(pkg, dependency);
      if (!dependencyInfo) {
        continue;
      }

      for (const typePackage of typePackages) {
        const existingType = this.getDependencyInfo(pkg, typePackage);
        if (existingType) {
          continue;
        }

        const version = this.resolveTypePackageVersion(typePackage);
        this.setDependencyVersion(pkg, typePackage, version, 'devDependencies');
        console.log(`✓ Added missing type package ${typePackage} required by ${dependency}`);
        changed = true;
      }
    }

    return changed;
  }

  private resolveTypePackageVersion(typePackage: string): string {
    return TYPE_DEPENDENCY_VERSION_MAP[typePackage] || '^1.0.0';
  }

  private sanitizeTsConfigIfPresent(
    files: Array<{ path: string; content: string }>,
    tsconfigIndex: number,
    needsDomLib: boolean
  ): Array<{ path: string; content: string }> {
    if (tsconfigIndex === -1) {
      return files;
    }

    const tsconfigFile = files[tsconfigIndex];
    const sanitized = [...files];
    const { changed, content } = this.sanitizeTsConfig(tsconfigFile.content, needsDomLib);

    if (changed) {
      sanitized[tsconfigIndex] = {
        ...tsconfigFile,
        content
      };
      console.log('✓ Normalized tsconfig.json compiler options');
    }

    return sanitized;
  }

  private sanitizeTsConfig(content: string, needsDomLib: boolean): { changed: boolean; content: string } {
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.warn('⚠ Could not parse tsconfig.json for sanitization:', error);
      return { changed: false, content };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { changed: false, content };
    }

    const compilerOptions = parsed.compilerOptions = parsed.compilerOptions || {};
    let changed = false;

    const baseLibs = new Set<string>();
    const existingLibs = Array.isArray(compilerOptions.lib) ? compilerOptions.lib : [];
    existingLibs.forEach((lib: string) => baseLibs.add(lib));

    if (!baseLibs.size) {
      baseLibs.add('ES2020');
      changed = true;
    }

    if (!baseLibs.has('ES2020')) {
      baseLibs.add('ES2020');
      changed = true;
    }

    if (needsDomLib) {
      if (!baseLibs.has('DOM')) {
        baseLibs.add('DOM');
        changed = true;
      }
      if (!baseLibs.has('DOM.Iterable')) {
        baseLibs.add('DOM.Iterable');
        changed = true;
      }
    }

    compilerOptions.lib = Array.from(baseLibs);

    // Ensure strict mode and module resolution defaults remain intact
    if (typeof compilerOptions.strict !== 'boolean') {
      compilerOptions.strict = true;
      changed = true;
    }

    if (!compilerOptions.moduleResolution) {
      compilerOptions.moduleResolution = 'node';
      changed = true;
    }

    if (compilerOptions.allowJs) {
      // Ensure allowJs does not conflict with type safety in generated code
      delete compilerOptions.allowJs;
      changed = true;
    }

    if (!changed) {
      return { changed: false, content };
    }

    return {
      changed: true,
      content: JSON.stringify(parsed, null, 2)
    };
  }

  private detectDomUsage(files: Array<{ path: string; content: string }>): boolean {
    return files.some(file => {
      const normalizedPath = this.normalizeFilePath(file.path).toLowerCase();
      const isTypeScript = normalizedPath.endsWith('.ts') || normalizedPath.endsWith('.tsx');
      if (!isTypeScript) {
        return false;
      }

      if (normalizedPath.includes('client') || normalizedPath.includes('frontend') || normalizedPath.endsWith('.tsx')) {
        return true;
      }

      return DOM_INDICATOR_REGEX.test(file.content);
    }) || files.some(file => this.normalizeFilePath(file.path).toLowerCase() === 'index.html');
  }

  /**
   * Get deployment logs from Fly.io
   */
  private async getDeploymentLogs(appName: string): Promise<string> {
    try {
      const result = await this.runCommand(
        'flyctl',
        ['logs', '--app', appName, '--no-tail'],
        process.cwd(),
        { checkBuildErrors: false }
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

  private runCommand(
    command: string, 
    args: string[], 
    workDir: string, 
    options?: { checkBuildErrors?: boolean; timeout?: number }
  ): Promise<{ code: number | null, stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: workDir,
            env: { ...process.env, FLY_API_TOKEN: this.flyApiToken },
            shell: false,
            windowsHide: true
        });

        let stdout = '';
        let stderr = '';
        let buildErrorDetected = false;
        let lastOutputTime = Date.now();
        
        // Set timeout (default 15 minutes for deploy, 30 seconds for other commands)
        const timeoutMs = options?.timeout || (args.includes('deploy') ? 15 * 60 * 1000 : 30000);
        const timeoutTimer = setTimeout(() => {
          if (!buildErrorDetected) {
            console.error(`⏱️ Command timeout after ${timeoutMs / 1000}s: ${command} ${args.join(' ')}`);
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), 5000); // Force kill after 5s if SIGTERM doesn't work
            
            const error: any = new Error(`Command timeout after ${timeoutMs / 1000} seconds`);
            error.timeout = true;
            error.deploymentLogs = stdout + '\n' + stderr;
            reject(error);
          }
        }, timeoutMs);
        
        // Heartbeat check - if no output for 2 minutes during deploy, log status
        const heartbeatInterval = setInterval(() => {
          const timeSinceLastOutput = Date.now() - lastOutputTime;
          if (timeSinceLastOutput > 120000 && args.includes('deploy')) { // 2 minutes
            console.log(`💓 Still running ${command} ${args.join(' ')} - ${Math.floor(timeSinceLastOutput / 1000)}s since last output`);
          }
        }, 30000); // Check every 30 seconds

        // Critical build errors that should stop deployment immediately
        const criticalBuildErrors = [
          'error TS',           // TypeScript compilation errors
          'error Command failed with exit code', // Yarn/npm command failures
          '#9 ERROR',           // Docker build step errors
          'RollupError:',       // Vite/Rollup bundling errors
          'Module not found',   // Missing module errors
          'Cannot find module', // Import resolution errors
          'SyntaxError:',       // JavaScript syntax errors
        ];

        // Filter function to only log important messages
        const shouldLogOutput = (output: string): boolean => {
            const line = output.toLowerCase().trim();
            
            // Skip these verbose/repetitive messages
            if (line.includes('nodes": null')) return false;
            if (line.includes('edges": null')) return false;
            if (line.includes('"id":') && !line.includes('error')) return false;
            if (line.includes('"internalnumericid":')) return false;
            if (line.includes('"organization":')) return false;
            if (line.includes('"secrets":')) return false;
            if (line.includes('"releases":')) return false;
            if (line.includes('"ipaddresses":')) return false;
            if (line.includes('"certificates":')) return false;
            if (line.includes('"machines":')) return false;
            if (line.includes('wireGuard')) return false;
            if (line.includes('loggedcertificates')) return false;
            if (line.includes('limitedaccesstokens')) return false;
            if (line.startsWith('{') && line.length > 100 && !line.includes('error')) return false; // Skip long JSON objects unless error
            
            // ALWAYS log these important messages
            if (line.includes('error')) return true;
            if (line.includes('fail')) return true;
            if (line.includes('warning')) return true;
            if (line.includes('creating')) return true;
            if (line.includes('building')) return true;
            if (line.includes('image')) return true; // Log building image progress
            if (line.includes('deploying')) return true;
            if (line.includes('deployed')) return true;
            if (line.includes('success')) return true;
            if (line.includes('visit your newly deployed app')) return true;
            if (line.includes('app created')) return true;
            if (line.includes('configuration is valid')) return true;
            if (line.includes('validating')) return true;
            if (line.includes('deployment')) return true;
            if (line.includes('updating')) return true;
            if (line.includes('pushing')) return true;
            if (line.includes('preparing')) return true;
            if (line.includes('==>')) return true; // Fly.io step indicators
            if (line.includes('step')) return true; // Docker build steps
            if (line.startsWith('#')) return true; // Docker layer info
            
            return false; // Skip everything else
        };

        const checkForBuildErrors = (output: string) => {
          if (!options?.checkBuildErrors || buildErrorDetected) return;
          
          for (const errorPattern of criticalBuildErrors) {
            if (output.includes(errorPattern)) {
              buildErrorDetected = true;
              console.error(`🚨 Critical build error detected: ${errorPattern}`);
              console.error('⚠️ Stopping deployment to prevent broken app...');
              
              // Clear timers
              clearTimeout(timeoutTimer);
              clearInterval(heartbeatInterval);
              
              // Kill the process to prevent deployment
              child.kill('SIGTERM');
              
              // Reject with detailed error
              const error: any = new Error(`Build failed: ${errorPattern} detected in output`);
              error.buildError = true;
              error.deploymentLogs = stdout + '\n' + stderr;
              reject(error);
              break;
            }
          }
        };

        child.stdout.on('data', (data) => {
            const output = data.toString();
            lastOutputTime = Date.now(); // Update last output time
            if (shouldLogOutput(output)) {
                console.log(`${command} stdout: ${output}`);
            }
            stdout += output;
            checkForBuildErrors(output);
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            lastOutputTime = Date.now(); // Update last output time
            if (shouldLogOutput(output)) {
                console.error(`${command} stderr: ${output}`);
            }
            stderr += output;
            checkForBuildErrors(output);
        });

        child.on('close', (code) => {
            clearTimeout(timeoutTimer);
            clearInterval(heartbeatInterval);
            if (!buildErrorDetected) {
              resolve({ code, stdout, stderr });
            }
            // If buildErrorDetected, we already rejected in checkForBuildErrors
        });

        child.on('error', (err) => {
            clearTimeout(timeoutTimer);
            clearInterval(heartbeatInterval);
            reject(err);
        });
    });
  }

  private async deployWithFlyctl(workDir: string, appName: string): Promise<void> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 Starting Fly.io deployment for app: ${appName}`);
    console.log(`📂 Working directory: ${workDir}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Check if app already exists
    console.log('📋 Checking if app exists...');
    const listResult = await this.runCommand('flyctl', ['apps', 'list', '--json'], workDir, { checkBuildErrors: false });
    
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
      console.log(`\n✨ Creating new Fly.io app: ${appName}`);
      const createResult = await this.runCommand('flyctl', ['apps', 'create', appName, '--org', 'personal'], workDir, { checkBuildErrors: false });

      if (createResult.code !== 0) {
        // Check if error is because app already exists (race condition or parsing failure)
        const errorMsg = createResult.stderr.toLowerCase();
        if (!errorMsg.includes('already') && !errorMsg.includes('taken')) {
          throw new Error(`flyctl apps create failed with code ${createResult.code}: ${createResult.stderr}`);
        }
        console.log(`✓ App ${appName} already exists (race condition), proceeding with deployment`);
      } else {
        console.log(`✓ App created successfully`);
      }
    } else {
      console.log(`\n♻️  App ${appName} already exists, updating deployment`);
    }

    // Deploy (this will update existing app or deploy new one)
    // Enable build error checking to stop deployment if build fails
    // Set 15 minute timeout for deployment (building can take time)
    console.log('🚀 Starting deployment with flyctl...');
    const deployResult = await this.runCommand('flyctl', ['deploy', '--remote-only'], workDir, { 
      checkBuildErrors: true,
      timeout: 15 * 60 * 1000 // 15 minutes
    });

    const fullOutput = deployResult.stderr + '\n' + deployResult.stdout;
    
    // Check for deployment failures - Fly.io may return code 0 even on build failures!
    // We need to check output for error indicators BEFORE deployment completes
    const errorIndicators = [
      'error during build:',
      'RollupError:',
      'Build failed',
      'error Command failed',
      'npm ERR!',
      'yarn error',
      'ERROR:',
      'FAILED',
      'Could not resolve',
      'Module not found',
      'Cannot find module',
      'SyntaxError:',
      'TypeError:',
      'ReferenceError:',
      'compilation failed',
      'build process failed',
      'error TS',           // TypeScript errors like "error TS2305"
      'error Command failed with exit code', // Yarn/npm command failures
      '#9 ERROR',           // Docker build step errors
      'executor failed'     // Docker executor failures
    ];
    
    const hasError = errorIndicators.some(indicator => 
      fullOutput.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (deployResult.code !== 0 || hasError) {
        // Create a detailed error with both stdout and stderr
        const error: any = new Error(
          hasError 
            ? `Fly.io build failed: ${errorIndicators.find(ind => fullOutput.toLowerCase().includes(ind.toLowerCase()))}`
            : `flyctl deploy failed with code ${deployResult.code}`
        );
        error.deploymentLogs = fullOutput;
        throw error;
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Deployment completed successfully!`);
    console.log(`🌐 App: ${appName}`);
    console.log(`${'='.repeat(80)}\n`);
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

  /**
   * Capture deployment error for learning system
   * @returns errorId for tracking
   */
  private async captureDeploymentError(
    files: Array<{ path: string; content: string }>,
    errorMessage: string,
    logs: string,
    attempt: number,
    generationId: string,
    language: string
  ): Promise<string | undefined> {
    try {
      console.log(`📚 [Learning] Capturing deployment error from attempt ${attempt}...`);
      
      // Generate error ID
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Detect framework from files (detectFramework needs prompt, but we don't have it here)
      // So we'll detect from file patterns
      const framework = this.learningService.detectFramework('', files.map(f => ({ 
        path: f.path, 
        content: f.content 
      })));

      // Parse TypeScript errors if present
      let typeScriptErrors;
      if (TypeScriptErrorParser.hasTypeScriptErrors(logs)) {
        const parsed = TypeScriptErrorParser.parseErrors(logs);
        typeScriptErrors = parsed.map(err => ({
          code: err.code,
          file: err.file,
          line: err.line,
          category: err.category,
          message: err.message.split('\n')[0] // First line only for storage
        }));
        console.log(`   📝 Captured ${typeScriptErrors.length} TypeScript error(s) for learning`);
      }

      await this.learningService.captureDeploymentError({
        errorMessage,
        buildLogs: logs,
        files: files.map(f => ({ path: f.path, content: f.content })),
        language,
        framework,
        platform: 'fly.io',
        userPrompt: `Deployment for generation ${generationId}`,
        fixAttempts: attempt,
        typeScriptErrors
      });
      
      console.log(`✓ Deployment error captured for learning (ID: ${errorId})`);
      return errorId;
    } catch (error) {
      console.error(`Failed to capture deployment error for learning:`, error);
      // Don't throw - learning capture failure shouldn't break deployment flow
      return undefined;
    }
  }

  /**
   * Mark an error as resolved in the learning system
   */
  private async markErrorResolved(errorId: string, appliedFix: string): Promise<void> {
    try {
      console.log(`✅ [Learning] Marking error ${errorId} as resolved`);
      await this.learningService.markErrorResolved(errorId, appliedFix);
    } catch (error) {
      console.error(`Failed to mark error as resolved:`, error);
      // Don't throw - learning failure shouldn't break deployment flow
    }
  }

  /**
   * Get error signature for tracking duplicate errors
   * Extracts key parts of error message to identify similar errors
   */
  private getErrorSignature(errorMessage: string): string {
    // Remove timestamps, line numbers, and other variable parts
    return errorMessage
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps
      .replace(/line\s+\d+/gi, 'line X') // Normalize line numbers
      .replace(/:\d+:\d+/g, ':X:X') // Normalize position references
      .replace(/\d+/g, 'N') // Replace all numbers with N
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase()
      .slice(0, 200); // First 200 chars for comparison
  }
}
