import { spawn } from 'child_process';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
import { generateDockerfile, detectLanguageFromFiles } from './DockerfileTemplates';

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
  let currentFiles = this.sanitizeGeneratedFiles(files);
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
  currentFiles = this.sanitizeGeneratedFiles(fixedFiles);

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
            currentFiles = this.sanitizeGeneratedFiles(fixedFiles);
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

        // Filter function to only log important messages
        const shouldLogOutput = (output: string): boolean => {
            const line = output.toLowerCase().trim();
            
            // Skip these verbose/repetitive messages
            if (line.includes('nodes": null')) return false;
            if (line.includes('edges": null')) return false;
            if (line.includes('"id":')) return false;
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
            if (line.startsWith('{') && line.length > 100) return false; // Skip long JSON objects
            if (line.includes('registry.fly.io')) return false; // Skip registry URLs
            
            // Log these important messages
            if (line.includes('error')) return true;
            if (line.includes('fail')) return true;
            if (line.includes('warning')) return true;
            if (line.includes('creating')) return true;
            if (line.includes('building')) return true;
            if (line.includes('deploying')) return true;
            if (line.includes('deployed')) return true;
            if (line.includes('success')) return true;
            if (line.includes('visit your newly deployed app')) return true;
            if (line.includes('app created')) return true;
            if (line.includes('configuration is valid')) return true;
            if (line.includes('deployment')) return true;
            
            return false; // Skip everything else
        };

        child.stdout.on('data', (data) => {
            const output = data.toString();
            if (shouldLogOutput(output)) {
                console.log(`${command} stdout: ${output}`);
            }
            stdout += output;
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            if (shouldLogOutput(output)) {
                console.error(`${command} stderr: ${output}`);
            }
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
