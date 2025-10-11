/**
 * Specialized Fix Agents - Targeted repairs for specific error types
 * 
 * Each fixer is highly specialized and uses rule-based fixes (NO LLM)
 * Only falls back to CodeFixerAgent (LLM) as last resort
 */

import * as ts from 'typescript';
import type { ValidationError, GeneratedFile } from './ComprehensiveValidator';

export interface FixResult {
  fixed: boolean;
  files: GeneratedFile[];
  appliedFixes: string[];
}

/**
 * Master fixer that routes to specialized fixers
 */
export class SpecializedFixerRouter {
  private dependencyFixer: DependencyFixerAgent;
  private syntaxFixer: SyntaxFixerAgent;
  private configFixer: ConfigFixerAgent;
  private moduleConverter: ModuleConverterAgent;

  constructor() {
    this.dependencyFixer = new DependencyFixerAgent();
    this.syntaxFixer = new SyntaxFixerAgent();
    this.configFixer = new ConfigFixerAgent();
    this.moduleConverter = new ModuleConverterAgent();
  }

  /**
   * Route errors to appropriate fixers
   */
  async fix(files: GeneratedFile[], errors: ValidationError[]): Promise<FixResult> {
    let currentFiles = [...files];
    const appliedFixes: string[] = [];

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SPECIALIZED FIX AGENTS                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Group errors by fix strategy
    const errorsByStrategy = this.groupErrorsByStrategy(errors);

    // Fix in priority order
    const strategies = [
      'dependency_fixer',
      'module_converter',
      'config_fixer',
      'syntax_fixer',
      'code_cleaner'
    ];

    for (const strategy of strategies) {
      const strategyErrors = errorsByStrategy.get(strategy) || [];
      if (strategyErrors.length === 0) continue;

      console.log(`┌─ Running ${strategy} for ${strategyErrors.length} errors ──────`);

      let result: FixResult | null = null;

      switch (strategy) {
        case 'dependency_fixer':
          result = this.dependencyFixer.fix(currentFiles, strategyErrors);
          break;
        case 'module_converter':
          result = this.moduleConverter.fix(currentFiles, strategyErrors);
          break;
        case 'config_fixer':
          result = this.configFixer.fix(currentFiles, strategyErrors);
          break;
        case 'syntax_fixer':
          result = this.syntaxFixer.fix(currentFiles, strategyErrors);
          break;
      }

      if (result && result.fixed) {
        currentFiles = result.files;
        appliedFixes.push(...result.appliedFixes);
        console.log(`└─ Fixed ${result.appliedFixes.length} issues\n`);
      } else {
        console.log(`└─ No fixes applied\n`);
      }
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║ Total fixes applied: ${appliedFixes.length}                              ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    return {
      fixed: appliedFixes.length > 0,
      files: currentFiles,
      appliedFixes
    };
  }

  private groupErrorsByStrategy(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();

    for (const error of errors) {
      if (!error.fixable || !error.fixStrategy) continue;

      if (!grouped.has(error.fixStrategy)) {
        grouped.set(error.fixStrategy, []);
      }
      grouped.get(error.fixStrategy)!.push(error);
    }

    return grouped;
  }
}

/**
 * Agent 1: Dependency Fixer
 * - Adds missing dependencies
 * - Fixes invalid versions
 * - Adds missing @types packages
 */
class DependencyFixerAgent {
  private versionMap: Record<string, string> = {
    // React ecosystem
    'react': '^18.3.1',
    'react-dom': '^18.3.1',
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',

    // Next.js
    'next': '^13.4.12',

    // Build tools
    'typescript': '^5.6.3',
    '@types/node': '^22.10.2',
    'vite': '^5.4.11',
    '@vitejs/plugin-react': '^4.3.4',

    // Backend
    'express': '^4.21.2',
    '@types/express': '^4.17.21',
    'cors': '^2.8.5',
    '@types/cors': '^2.8.17',

    // Testing
    'jest': '^29.7.0',
    '@types/jest': '^29.5.14',
    'ts-jest': '^29.2.5',

    // Utilities
    'axios': '^1.7.9',
    'eslint': '^8.56.0'
  };

  fix(files: GeneratedFile[], errors: ValidationError[]): FixResult {
    const appliedFixes: string[] = [];
    const packageJsonFile = files.find(f => f.path === 'package.json');

    if (!packageJsonFile) {
      // Create package.json if missing
      const newPackageJson: GeneratedFile = {
        path: 'package.json',
        content: JSON.stringify({
          name: 'generated-app',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start'
          },
          dependencies: {},
          devDependencies: {}
        }, null, 2)
      };
      appliedFixes.push('Created missing package.json');
      return {
        fixed: true,
        files: [...files, newPackageJson],
        appliedFixes
      };
    }

    try {
      const pkg = JSON.parse(packageJsonFile.content);

      for (const error of errors) {
        if (error.category === 'missing_types') {
          // Extract package name from message: "Missing @types/react for react"
          const match = error.message.match(/Missing (@types\/[\w-]+)/);
          if (match) {
            const typePkg = match[1];
            const version = this.versionMap[typePkg] || 'latest';

            pkg.devDependencies = pkg.devDependencies || {};
            pkg.devDependencies[typePkg] = version;
            appliedFixes.push(`Added ${typePkg}@${version}`);
          }
        }

        if (error.category === 'dependency_version') {
          // Fix invalid versions
          const match = error.message.match(/package "([^"]+)"/);
          if (match) {
            const pkgName = match[1];
            const newVersion = this.versionMap[pkgName] || '^1.0.0';

            // Find which section has this package
            const sections = ['dependencies', 'devDependencies', 'peerDependencies'];
            for (const section of sections) {
              if (pkg[section]?.[pkgName]) {
                pkg[section][pkgName] = newVersion;
                appliedFixes.push(`Fixed ${pkgName} version to ${newVersion}`);
                break;
              }
            }
          }
        }

        if (error.category === 'package_json' && error.message.includes('Missing "name"')) {
          pkg.name = 'generated-app';
          appliedFixes.push('Added package name');
        }
      }

      if (appliedFixes.length > 0) {
        const updatedFiles = files.map(f =>
          f.path === 'package.json'
            ? { ...f, content: JSON.stringify(pkg, null, 2) }
            : f
        );

        return {
          fixed: true,
          files: updatedFiles,
          appliedFixes
        };
      }

    } catch (error) {
      console.error('Failed to fix dependencies:', error);
    }

    return {
      fixed: false,
      files,
      appliedFixes: []
    };
  }
}

/**
 * Agent 2: Module Converter
 * - Converts CommonJS to ESM
 * - Fixes module.exports issues
 */
class ModuleConverterAgent {
  fix(files: GeneratedFile[], errors: ValidationError[]): FixResult {
    const appliedFixes: string[] = [];
    let updatedFiles = [...files];

    for (const error of errors) {
      if (error.category !== 'module_system' && error.category !== 'config_mismatch') continue;
      if (!error.file) continue;

      const fileIndex = updatedFiles.findIndex(f => f.path === error.file);
      if (fileIndex === -1) continue;

      const file = updatedFiles[fileIndex];
      let newContent = file.content;

      // Convert module.exports to export default
      if (newContent.includes('module.exports')) {
        // Handle: module.exports = { ... }
        newContent = newContent.replace(
          /module\.exports\s*=\s*(\{[^}]+\})/,
          'export default $1'
        );

        // Handle: module.exports = function() { ... }
        newContent = newContent.replace(
          /module\.exports\s*=\s*([\w]+)/,
          'export default $1'
        );

        appliedFixes.push(`Converted ${file.path} from CommonJS to ESM`);
        updatedFiles[fileIndex] = { ...file, content: newContent };
      }

      // Special case: next.config.js with ESM package.json
      if (file.path === 'next.config.js' && error.message.includes('rename to .cjs')) {
        // Rename to .cjs instead of converting
        updatedFiles[fileIndex] = { ...file, path: 'next.config.cjs' };
        appliedFixes.push('Renamed next.config.js to next.config.cjs');
      }
    }

    return {
      fixed: appliedFixes.length > 0,
      files: updatedFiles,
      appliedFixes
    };
  }
}

/**
 * Agent 3: Config Fixer
 * - Fixes tsconfig.json issues
 * - Fixes Next.js config
 * - Ensures jsx configuration
 */
class ConfigFixerAgent {
  fix(files: GeneratedFile[], errors: ValidationError[]): FixResult {
    const appliedFixes: string[] = [];
    let updatedFiles = [...files];

    // Fix tsconfig.json
    const tsconfigIndex = updatedFiles.findIndex(f => f.path === 'tsconfig.json');
    if (tsconfigIndex !== -1) {
      try {
        const tsconfig = JSON.parse(updatedFiles[tsconfigIndex].content);

        for (const error of errors) {
          if (error.file !== 'tsconfig.json') continue;

          // Fix missing jsx
          if (error.category === 'missing_config' && error.message.includes('jsx')) {
            tsconfig.compilerOptions = tsconfig.compilerOptions || {};
            tsconfig.compilerOptions.jsx = 'react-jsx';
            appliedFixes.push('Added jsx: "react-jsx" to tsconfig.json');
          }

          // Fix module for ESM
          if (error.category === 'config_mismatch' && error.message.includes('module')) {
            tsconfig.compilerOptions = tsconfig.compilerOptions || {};
            tsconfig.compilerOptions.module = 'ESNext';
            appliedFixes.push('Updated module to "ESNext" in tsconfig.json');
          }
        }

        if (appliedFixes.length > 0) {
          updatedFiles[tsconfigIndex] = {
            ...updatedFiles[tsconfigIndex],
            content: JSON.stringify(tsconfig, null, 2)
          };
        }

      } catch (error) {
        console.error('Failed to fix tsconfig.json:', error);
      }
    }

    // Fix next.config.js
    const nextConfigIndex = updatedFiles.findIndex(f => f.path === 'next.config.js' || f.path === 'next.config.mjs');
    if (nextConfigIndex !== -1) {
      let nextConfig = updatedFiles[nextConfigIndex].content;

      for (const error of errors) {
        if (!error.file?.startsWith('next.config')) continue;

        // Remove deprecated swcMinify
        if (error.category === 'deprecated_config' && error.message.includes('swcMinify')) {
          nextConfig = nextConfig.replace(/,?\s*swcMinify:\s*true,?/g, '');
          appliedFixes.push('Removed deprecated swcMinify from Next.js config');
        }
      }

      if (appliedFixes.some(f => f.includes('Next.js config'))) {
        updatedFiles[nextConfigIndex] = {
          ...updatedFiles[nextConfigIndex],
          content: nextConfig
        };
      }
    }

    // Fix port configuration
    for (const error of errors) {
      if (error.category !== 'port_config') continue;
      if (!error.file) continue;

      const fileIndex = updatedFiles.findIndex(f => f.path === error.file);
      if (fileIndex === -1) continue;

      const file = updatedFiles[fileIndex];
      let newContent = file.content;

      // Replace hardcoded port with environment variable
      newContent = newContent.replace(
        /\.listen\(\s*(\d+)/g,
        '.listen(process.env.PORT || $1'
      );

      if (newContent !== file.content) {
        updatedFiles[fileIndex] = { ...file, content: newContent };
        appliedFixes.push(`Fixed port configuration in ${file.path}`);
      }
    }

    return {
      fixed: appliedFixes.length > 0,
      files: updatedFiles,
      appliedFixes
    };
  }
}

/**
 * Agent 4: Syntax Fixer
 * - Fixes common syntax mistakes
 * - Uses AST transformations
 */
class SyntaxFixerAgent {
  fix(files: GeneratedFile[], errors: ValidationError[]): FixResult {
    const appliedFixes: string[] = [];
    let updatedFiles = [...files];

    for (const error of errors) {
      if (error.category !== 'syntax') continue;
      if (!error.file) continue;

      const fileIndex = updatedFiles.findIndex(f => f.path === error.file);
      if (fileIndex === -1) continue;

      const file = updatedFiles[fileIndex];
      let newContent = file.content;

      // Fix className{...} -> className={...}
      if (error.message.includes('className')) {
        newContent = newContent.replace(/className\{/g, 'className={');
        appliedFixes.push(`Fixed JSX attribute syntax in ${file.path}`);
      }

      // Fix missing semicolons
      if (error.message.includes('semicolon')) {
        // Use TypeScript formatter to add semicolons
        try {
          const sourceFile = ts.createSourceFile(
            file.path,
            newContent,
            ts.ScriptTarget.Latest,
            true
          );

          const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
          newContent = printer.printFile(sourceFile);
          appliedFixes.push(`Fixed syntax errors in ${file.path}`);
        } catch (e) {
          // If AST transformation fails, skip
        }
      }

      if (newContent !== file.content) {
        updatedFiles[fileIndex] = { ...file, content: newContent };
      }
    }

    return {
      fixed: appliedFixes.length > 0,
      files: updatedFiles,
      appliedFixes
    };
  }
}
