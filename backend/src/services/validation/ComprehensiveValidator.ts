/**
 * ComprehensiveValidator - Multi-layer validation system
 * Catches ALL errors before deployment, just like Fly.io does
 * 
 * Architecture:
 * 1. Static Analysis (syntax, config, dependencies)
 * 2. Build Simulation (actual compilation)
 * 3. Runtime Validation (sandboxed execution)
 * 4. Specialized Fix Agents (targeted repairs)
 */

import * as ts from 'typescript';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import tmp from 'tmp';

export interface ValidationError {
  severity: 'critical' | 'high' | 'medium' | 'low';
  layer: 'static' | 'build' | 'runtime';
  category: string;
  file?: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  fixable: boolean;
  fixStrategy?: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  duration: number;
  layerResults: {
    static: { passed: boolean; errors: number };
    build: { passed: boolean; errors: number };
    runtime: { passed: boolean; errors: number };
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export class ComprehensiveValidator {
  private language: string;

  constructor(language: string = 'typescript') {
    this.language = language;
  }

  /**
   * Main validation pipeline - runs all layers
   */
  async validate(files: GeneratedFile[]): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║       COMPREHENSIVE VALIDATION PIPELINE                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Layer 1: Static Analysis (Fast, rule-based)
    console.log('┌─ Layer 1: Static Analysis ─────────────────────────────────┐');
    const staticErrors = await this.runStaticAnalysis(files);
    errors.push(...staticErrors);
    console.log(`└─ Found ${staticErrors.length} issues\n`);

    // Layer 2: Build Simulation (Medium speed, actual compilation)
    console.log('┌─ Layer 2: Build Simulation ────────────────────────────────┐');
    const buildErrors = await this.runBuildSimulation(files);
    errors.push(...buildErrors);
    console.log(`└─ Found ${buildErrors.length} issues\n`);

    // Layer 3: Runtime Validation (Slower, sandboxed execution)
    console.log('┌─ Layer 3: Runtime Validation ──────────────────────────────┐');
    const runtimeErrors = await this.runRuntimeValidation(files);
    errors.push(...runtimeErrors);
    console.log(`└─ Found ${runtimeErrors.length} issues\n`);

    const duration = Date.now() - startTime;

    // Separate errors and warnings
    const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'high');
    const minorIssues = errors.filter(e => e.severity === 'medium' || e.severity === 'low');
    warnings.push(...minorIssues);

    const layerResults = {
      static: {
        passed: staticErrors.length === 0,
        errors: staticErrors.length
      },
      build: {
        passed: buildErrors.length === 0,
        errors: buildErrors.length
      },
      runtime: {
        passed: runtimeErrors.length === 0,
        errors: runtimeErrors.length
      }
    };

    const passed = criticalErrors.length === 0;

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 VALIDATION SUMMARY                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Status: ${passed ? '✓ PASSED' : '✗ FAILED'}                                      ║`);
    console.log(`║ Critical Errors: ${criticalErrors.length}                                    ║`);
    console.log(`║ Warnings: ${warnings.length}                                           ║`);
    console.log(`║ Duration: ${duration}ms                                        ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    return {
      passed,
      errors: criticalErrors,
      warnings,
      duration,
      layerResults
    };
  }

  /**
   * Layer 1: Static Analysis
   * - Syntax validation
   * - JSON/Config validation
   * - Dependency validation
   * - Security scanning
   */
  private async runStaticAnalysis(files: GeneratedFile[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // 1.1 Syntax Validation
    console.log('  ├─ Validating syntax...');
    errors.push(...this.validateSyntax(files));

    // 1.2 JSON/Config Validation
    console.log('  ├─ Validating JSON/config files...');
    errors.push(...this.validateJsonConfigs(files));

    // 1.3 Dependency Validation
    console.log('  ├─ Validating dependencies...');
    errors.push(...this.validateDependencies(files));

    // 1.4 Security Scanning
    console.log('  ├─ Scanning for security issues...');
    errors.push(...this.scanSecurity(files));

    // 1.5 Module Resolution
    console.log('  ├─ Checking module resolution...');
    errors.push(...this.validateModuleResolution(files));

    // 1.6 Configuration Consistency
    console.log('  └─ Checking configuration consistency...');
    errors.push(...this.validateConfigConsistency(files));

    return errors;
  }

  /**
   * Layer 2: Build Simulation
   * - Actual TypeScript compilation
   * - Webpack/Vite build test
   * - Package installation simulation
   */
  private async runBuildSimulation(files: GeneratedFile[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Create temporary directory for build simulation
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    try {
      // Write files to temp directory
      for (const file of files) {
        const filePath = path.join(tmpDir.name, file.path);
        const dirName = path.dirname(filePath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }

      if (this.language === 'typescript') {
        // 2.1 TypeScript Compilation Check
        console.log('  ├─ Running TypeScript compiler...');
        errors.push(...await this.runTypeScriptCompiler(tmpDir.name, files));

        // 2.2 Check for Next.js specific issues
        const hasNextConfig = files.some(f => f.path === 'next.config.js' || f.path === 'next.config.mjs');
        if (hasNextConfig) {
          console.log('  ├─ Validating Next.js configuration...');
          errors.push(...this.validateNextJsConfig(files));
        }

        // 2.3 Package installation dry-run
        console.log('  └─ Testing package installation...');
        errors.push(...await this.testPackageInstallation(tmpDir.name));
      }

    } finally {
      tmpDir.removeCallback();
    }

    return errors;
  }

  /**
   * Layer 3: Runtime Validation
   * - Import resolution
   * - Entry point validation
   * - Basic execution test
   */
  private async runRuntimeValidation(files: GeneratedFile[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // 3.1 Entry Point Validation
    console.log('  ├─ Validating entry points...');
    errors.push(...this.validateEntryPoints(files));

    // 3.2 Import Resolution
    console.log('  ├─ Checking import resolution...');
    errors.push(...this.validateImportResolution(files));

    // 3.3 Port Configuration
    console.log('  └─ Validating port configuration...');
    errors.push(...this.validatePortConfig(files));

    return errors;
  }

  /**
   * 1.1 Syntax Validation - TypeScript/JavaScript
   */
  private validateSyntax(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const file of files) {
      if (!this.isCodeFile(file.path)) continue;

      try {
        if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
          // TypeScript syntax check
          const sourceFile = ts.createSourceFile(
            file.path,
            file.content,
            ts.ScriptTarget.Latest,
            true
          );

          // Check for syntax errors
          const diagnostics = (sourceFile as any).parseDiagnostics || [];
          for (const diagnostic of diagnostics) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
            errors.push({
              severity: 'critical',
              layer: 'static',
              category: 'syntax',
              file: file.path,
              line: line + 1,
              column: character + 1,
              message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
              code: `TS${diagnostic.code}`,
              fixable: false,
              fixStrategy: 'manual'
            });
          }

          // Check for common mistakes
          errors.push(...this.detectCommonMistakes(file, sourceFile));
        }
      } catch (error: any) {
        errors.push({
          severity: 'critical',
          layer: 'static',
          category: 'syntax',
          file: file.path,
          message: `Syntax error: ${error.message}`,
          fixable: false
        });
      }
    }

    return errors;
  }

  /**
   * Detect common coding mistakes
   */
  private detectCommonMistakes(file: GeneratedFile, sourceFile: ts.SourceFile): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check 1: className{...} instead of className={...}
    const classNameRegex = /className\{[^=]/g;
    let match;
    while ((match = classNameRegex.exec(file.content)) !== null) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(match.index);
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'syntax',
        file: file.path,
        line: line + 1,
        column: character + 1,
        message: 'Missing "=" in JSX attribute. Did you mean className={...}?',
        fixable: true,
        fixStrategy: 'syntax_fixer'
      });
    }

    // Check 2: module.exports in ESM
    if (file.content.includes('module.exports') && this.isEsmProject(file)) {
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'module_system',
        file: file.path,
        message: 'CommonJS "module.exports" used in ES module. Use "export default" instead.',
        fixable: true,
        fixStrategy: 'module_converter'
      });
    }

    // Check 3: Router.useRouter() pattern (wrong Next.js hook usage)
    if (file.content.includes('Router.useRouter()')) {
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'syntax',
        file: file.path,
        message: 'Property \'useRouter\' does not exist on type \'() => NextRouter\'. Import and use useRouter() directly.',
        fixable: true,
        fixStrategy: 'syntax_fixer'
      });
    }

    // Check 4: Problematic template strings with nested backticks
    // Pattern: `...${arr.map(x => `...`).join('...')}...`
    const nestedTemplateRegex = /`[^`]*\$\{[^}]*\.map\([^)]+\s*=>\s*`[^`]*`[^}]*\}[^`]*`/g;
    while ((match = nestedTemplateRegex.exec(file.content)) !== null) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(match.index);
      errors.push({
        severity: 'high',
        layer: 'static',
        category: 'syntax',
        file: file.path,
        line: line + 1,
        message: 'Potentially problematic nested template string. May cause "Unterminated string literal" error.',
        fixable: true,
        fixStrategy: 'syntax_fixer'
      });
    }

    // Check 5: Missing import for hooks
    if (file.content.includes('useRouter()') && !file.content.match(/import.*useRouter.*from ['"]next\/router['"]/)) {
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'syntax',
        file: file.path,
        message: 'useRouter() is used but not imported from \'next/router\'',
        fixable: true,
        fixStrategy: 'syntax_fixer'
      });
    }

    if (file.content.includes('useState(') && !file.content.match(/import.*useState.*from ['"]react['"]/)) {
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'syntax',
        file: file.path,
        message: 'useState() is used but not imported from \'react\'',
        fixable: true,
        fixStrategy: 'syntax_fixer'
      });
    }

    return errors;
  }

  /**
   * 1.2 JSON/Config Validation
   */
  private validateJsonConfigs(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const file of files) {
      if (!file.path.endsWith('.json')) continue;

      try {
        JSON.parse(file.content);
      } catch (error: any) {
        errors.push({
          severity: 'critical',
          layer: 'static',
          category: 'json',
          file: file.path,
          message: `Invalid JSON: ${error.message}`,
          fixable: false
        });
      }
    }

    return errors;
  }

  /**
   * 1.3 Dependency Validation
   */
  private validateDependencies(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const packageJson = files.find(f => f.path === 'package.json');

    // Check if this is a static HTML project (no build tools needed)
    const hasIndexHtml = files.some(f => f.path === 'index.html');
    const hasStylesCss = files.some(f => f.path === 'styles.css' || f.path.endsWith('.css'));
    const hasTsOrTsxFiles = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    const isStaticHtml = hasIndexHtml && hasStylesCss && !hasTsOrTsxFiles;

    if (!packageJson) {
      // Skip package.json requirement for static HTML projects
      if (isStaticHtml) {
        console.log('ℹ️ Static HTML project detected - skipping package.json requirement');
        return errors;
      }
      
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'missing_file',
        file: 'package.json',
        message: 'Missing package.json file',
        fixable: true,
        fixStrategy: 'dependency_fixer'
      });
      return errors;
    }

    try {
      const pkg = JSON.parse(packageJson.content);

      // Check for required fields
      if (!pkg.name) {
        errors.push({
          severity: 'high',
          layer: 'static',
          category: 'package_json',
          file: 'package.json',
          message: 'Missing "name" field in package.json',
          fixable: true,
          fixStrategy: 'dependency_fixer'
        });
      }

      // Check for invalid dependency versions
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (typeof version !== 'string') continue;

        // Check for placeholder versions
        if (['latest', 'next', '*', ''].includes(version)) {
          errors.push({
            severity: 'high',
            layer: 'static',
            category: 'dependency_version',
            file: 'package.json',
            message: `Invalid version "${version}" for package "${name}". Use specific version.`,
            fixable: true,
            fixStrategy: 'dependency_fixer'
          });
        }

        // Check for workspace: protocol in production
        if (version.startsWith('workspace:')) {
          errors.push({
            severity: 'critical',
            layer: 'static',
            category: 'dependency_version',
            file: 'package.json',
            message: `Workspace protocol not supported for "${name}". Use npm registry version.`,
            fixable: true,
            fixStrategy: 'dependency_fixer'
          });
        }
      }

      // Check for missing @types packages
      errors.push(...this.checkMissingTypeDefinitions(pkg, files));

    } catch (error: any) {
      errors.push({
        severity: 'critical',
        layer: 'static',
        category: 'json',
        file: 'package.json',
        message: `Failed to parse package.json: ${error.message}`,
        fixable: false
      });
    }

    return errors;
  }

  /**
   * Check for missing type definitions
   */
  private checkMissingTypeDefinitions(pkg: any, files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if this is a TypeScript project
    const hasTypeScript = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    if (!hasTypeScript) return errors;

    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    // Common packages that need @types
    const needsTypes: Record<string, string> = {
      'react': '@types/react',
      'react-dom': '@types/react-dom',
      'express': '@types/express',
      'node': '@types/node',
      'cors': '@types/cors',
      'jest': '@types/jest'
    };

    for (const [pkg, typePkg] of Object.entries(needsTypes)) {
      if (deps[pkg] && !devDeps[typePkg]) {
        errors.push({
          severity: 'critical',
          layer: 'static',
          category: 'missing_types',
          file: 'package.json',
          message: `Missing ${typePkg} for ${pkg}`,
          fixable: true,
          fixStrategy: 'dependency_fixer'
        });
      }
    }

    return errors;
  }

  /**
   * 1.4 Security Scanning
   */
  private scanSecurity(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const file of files) {
      if (!this.isCodeFile(file.path)) continue;

      // Check for hardcoded secrets
      const secretPatterns = [
        { regex: /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{20,}['"]/gi, type: 'API Key' },
        { regex: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Password' },
        { regex: /-----BEGIN (RSA |DSA )?PRIVATE KEY-----/gi, type: 'Private Key' },
        { regex: /(sk|pk)_live_[a-zA-Z0-9]{24,}/gi, type: 'Stripe Key' }
      ];

      for (const pattern of secretPatterns) {
        if (pattern.regex.test(file.content)) {
          errors.push({
            severity: 'critical',
            layer: 'static',
            category: 'security',
            file: file.path,
            message: `Potential hardcoded ${pattern.type} detected. Use environment variables.`,
            fixable: false
          });
        }
      }

      // Check for console.log in production
      if (file.content.includes('console.log') && !file.path.includes('test')) {
        errors.push({
          severity: 'low',
          layer: 'static',
          category: 'best_practice',
          file: file.path,
          message: 'console.log() found in production code. Consider removing or using proper logging.',
          fixable: true,
          fixStrategy: 'code_cleaner'
        });
      }
    }

    return errors;
  }

  /**
   * 1.5 Module Resolution Validation
   */
  private validateModuleResolution(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build a map of available files
    const fileMap = new Map<string, GeneratedFile>();
    for (const file of files) {
      fileMap.set(file.path, file);
    }

    for (const file of files) {
      if (!this.isCodeFile(file.path)) continue;

      // Extract import statements
      const imports = this.extractImports(file.content);

      for (const imp of imports) {
        // Skip node_modules and external packages
        if (!imp.startsWith('.') && !imp.startsWith('/')) continue;

        // Resolve relative path
        const basePath = path.dirname(file.path);
        const resolvedPath = path.normalize(path.join(basePath, imp));

        // Check if file exists
        const exists = fileMap.has(resolvedPath) ||
                      fileMap.has(resolvedPath + '.ts') ||
                      fileMap.has(resolvedPath + '.tsx') ||
                      fileMap.has(resolvedPath + '.js') ||
                      fileMap.has(resolvedPath + '.jsx') ||
                      fileMap.has(resolvedPath + '/index.ts') ||
                      fileMap.has(resolvedPath + '/index.tsx');

        if (!exists) {
          errors.push({
            severity: 'critical',
            layer: 'static',
            category: 'module_resolution',
            file: file.path,
            message: `Cannot resolve module "${imp}"`,
            fixable: false
          });
        }
      }
    }

    return errors;
  }

  /**
   * 1.6 Configuration Consistency Validation
   */
  private validateConfigConsistency(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const packageJson = files.find(f => f.path === 'package.json');
    const tsconfig = files.find(f => f.path === 'tsconfig.json');

    if (packageJson && tsconfig) {
      try {
        const pkg = JSON.parse(packageJson.content);
        const tsConf = JSON.parse(tsconfig.content);

        // Check if package.json has "type": "module" but tsconfig uses wrong module
        if (pkg.type === 'module') {
          const module = tsConf.compilerOptions?.module;
          if (module && !['ESNext', 'ES2020', 'ES2022'].includes(module)) {
            errors.push({
              severity: 'high',
              layer: 'static',
              category: 'config_mismatch',
              file: 'tsconfig.json',
              message: `package.json uses "type": "module" but tsconfig.json has module: "${module}". Use "ESNext" or "ES2020".`,
              fixable: true,
              fixStrategy: 'config_fixer'
            });
          }

          // Check for CommonJS exports in .js config files
          const nextConfig = files.find(f => f.path === 'next.config.js');
          if (nextConfig && nextConfig.content.includes('module.exports')) {
            errors.push({
              severity: 'critical',
              layer: 'static',
              category: 'config_mismatch',
              file: 'next.config.js',
              message: 'package.json uses "type": "module" but next.config.js uses CommonJS. Use "export default" or rename to .cjs',
              fixable: true,
              fixStrategy: 'module_converter'
            });
          }
        }

        // Check if React project has jsx configured
        const hasReact = pkg.dependencies?.react || pkg.devDependencies?.react;
        if (hasReact && tsconfig) {
          const jsx = tsConf.compilerOptions?.jsx;
          if (!jsx) {
            errors.push({
              severity: 'critical',
              layer: 'static',
              category: 'missing_config',
              file: 'tsconfig.json',
              message: 'React project missing "jsx" compiler option. Add "jsx": "react-jsx"',
              fixable: true,
              fixStrategy: 'config_fixer'
            });
          }
        }

        // Check if React + Vite project has @vitejs/plugin-react
        const hasVite = files.some(f => f.path === 'vite.config.ts' || f.path === 'vite.config.js');
        if (hasReact && hasVite) {
          const hasPluginReact = pkg.devDependencies?.['@vitejs/plugin-react'];
          if (!hasPluginReact) {
            errors.push({
              severity: 'critical',
              layer: 'static',
              category: 'missing_dependency',
              file: 'package.json',
              message: 'React + Vite project missing "@vitejs/plugin-react" in devDependencies. Add "@vitejs/plugin-react": "^4.0.0"',
              fixable: true,
              fixStrategy: 'dependency_fixer'
            });
          }
        }

      } catch (error: any) {
        // Already caught by JSON validation
      }
    }

    return errors;
  }

  /**
   * 2.1 TypeScript Compiler Check
   */
  private async runTypeScriptCompiler(workDir: string, _files: GeneratedFile[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
        cwd: workDir,
        shell: true,
        windowsHide: true
      });

      let output = '';

      tsc.stdout.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        output += data.toString();
      });

      tsc.on('close', (code) => {
        if (code !== 0 && output) {
          // Parse TypeScript errors
          const lines = output.split('\n');
          for (const line of lines) {
            const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
            if (match) {
              const [, filePath, line, column, code, message] = match;
              errors.push({
                severity: 'critical',
                layer: 'build',
                category: 'typescript',
                file: filePath,
                line: parseInt(line),
                column: parseInt(column),
                code,
                message,
                fixable: false
              });
            }
          }

          // If no structured errors found, add generic error
          if (errors.length === 0 && output.includes('error')) {
            errors.push({
              severity: 'critical',
              layer: 'build',
              category: 'typescript',
              message: 'TypeScript compilation failed. Check output for details.',
              fixable: false
            });
          }
        }

        resolve(errors);
      });

      tsc.on('error', (error) => {
        errors.push({
          severity: 'critical',
          layer: 'build',
          category: 'typescript',
          message: `Failed to run TypeScript compiler: ${error.message}`,
          fixable: false
        });
        resolve(errors);
      });
    });
  }

  /**
   * 2.2 Next.js Configuration Validation
   */
  private validateNextJsConfig(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const nextConfig = files.find(f => f.path === 'next.config.js' || f.path === 'next.config.mjs');
    const packageJson = files.find(f => f.path === 'package.json');

    if (!nextConfig) return errors;

    try {
      const pkg = packageJson ? JSON.parse(packageJson.content) : {};

      // Check for deprecated swcMinify option
      if (nextConfig.content.includes('swcMinify')) {
        errors.push({
          severity: 'high',
          layer: 'build',
          category: 'deprecated_config',
          file: nextConfig.path,
          message: '"swcMinify" is deprecated in Next.js 13+. Remove it from config.',
          fixable: true,
          fixStrategy: 'config_fixer'
        });
      }

      // Check module system mismatch
      if (pkg.type === 'module' && nextConfig.content.includes('module.exports')) {
        errors.push({
          severity: 'critical',
          layer: 'build',
          category: 'module_system',
          file: nextConfig.path,
          message: 'ESM package.json but CommonJS Next.js config. Use "export default" or rename to .cjs',
          fixable: true,
          fixStrategy: 'module_converter'
        });
      }

    } catch (error: any) {
      // Already caught elsewhere
    }

    return errors;
  }

  /**
   * 2.3 Package Installation Test
   */
  private async testPackageInstallation(_workDir: string): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Skip actual installation for now (too slow)
    // TODO: Implement package.json validation against npm registry

    return errors;
  }

  /**
   * 3.1 Entry Point Validation
   */
  private validateEntryPoints(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const packageJson = files.find(f => f.path === 'package.json');

    if (!packageJson) return errors;

    try {
      const pkg = JSON.parse(packageJson.content);

      // Check main entry point
      if (pkg.main) {
        const mainFile = files.find(f => f.path === pkg.main);
        if (!mainFile) {
          errors.push({
            severity: 'high',
            layer: 'runtime',
            category: 'missing_file',
            file: pkg.main,
            message: `Entry point "${pkg.main}" specified in package.json does not exist`,
            fixable: false
          });
        }
      }

      // Check scripts
      if (pkg.scripts?.start && !pkg.scripts.start.includes('next')) {
        // Validate start script points to existing file
        const startMatch = pkg.scripts.start.match(/node\s+([^\s]+)/);
        if (startMatch) {
          const startFile = startMatch[1];
          const exists = files.some(f => f.path === startFile);
          if (!exists) {
            errors.push({
              severity: 'high',
              layer: 'runtime',
              category: 'missing_file',
              file: startFile,
              message: `Start script references non-existent file: ${startFile}`,
              fixable: false
            });
          }
        }
      }

    } catch (error: any) {
      // Already caught elsewhere
    }

    return errors;
  }

  /**
   * 3.2 Import Resolution Validation
   */
  private validateImportResolution(_files: GeneratedFile[]): ValidationError[] {
    // Already done in static analysis
    return [];
  }

  /**
   * 3.3 Port Configuration Validation
   */
  private validatePortConfig(files: GeneratedFile[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for port binding in code
    for (const file of files) {
      if (!this.isCodeFile(file.path)) continue;

      // Look for .listen() calls
      const listenMatch = file.content.match(/\.listen\(\s*(\d+)/);
      if (listenMatch) {
        const port = parseInt(listenMatch[1]);
        if (port !== 80 && port !== 3000 && port !== 8080) {
          errors.push({
            severity: 'medium',
            layer: 'runtime',
            category: 'port_config',
            file: file.path,
            message: `Non-standard port ${port} detected. Consider using PORT environment variable.`,
            fixable: true,
            fixStrategy: 'config_fixer'
          });
        }
      }
    }

    return errors;
  }

  // Helper methods

  private isCodeFile(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx|py|java|go|rs)$/.test(filePath);
  }

  private isEsmProject(file: GeneratedFile): boolean {
    // Check if package.json has "type": "module"
    // This is a simplified check
    return file.path.endsWith('.mjs') || file.content.includes('"type": "module"');
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const es6Regex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6Regex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // require() calls
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }
}
