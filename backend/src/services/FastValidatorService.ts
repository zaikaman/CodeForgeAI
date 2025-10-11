/**
 * Fast Validation Service - Lightning-fast static validation without execution
 * 
 * Performance target: < 2 seconds for full validation
 * 
 * Strategy:
 * - Layer 1: Syntax validation (100-200ms) - using native parsers
 * - Layer 2: Dependency validation (200-300ms) - regex + heuristics
 * - Layer 3: Critical pattern matching (300-500ms) - anti-patterns
 * 
 * Total: ~600-1000ms
 */

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ValidationError {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  file: string;
  line?: number;
  message: string;
  suggestedFix?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  duration: number;
  confidence: number;
}

interface ValidationPattern {
  regex: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  fix: string;
}

export class FastValidatorService {
  /**
   * Main validation entry point
   */
  async validate(files: GeneratedFile[], language: string): Promise<ValidationResult> {
    const start = Date.now();
    const allErrors: ValidationError[] = [];
    
    try {
      // Layer 1: Syntax validation (parallel for speed)
      console.log('🔍 Layer 1: Syntax validation...');
      const syntaxErrors = await this.validateSyntax(files, language);
      allErrors.push(...syntaxErrors);
      
      // Layer 2: Dependency validation
      console.log('🔍 Layer 2: Dependency validation...');
      const depErrors = await this.validateDependencies(files, language);
      allErrors.push(...depErrors);
      
      // Layer 3: Critical pattern checks
      console.log('🔍 Layer 3: Pattern validation...');
      const patternErrors = this.validatePatterns(files, language);
      allErrors.push(...patternErrors);
      
      // Layer 4: File structure validation
      console.log('🔍 Layer 4: Structure validation...');
      const structureErrors = this.validateStructure(files, language);
      allErrors.push(...structureErrors);
      
      const duration = Date.now() - start;
      
      // Separate errors by severity
      const criticalErrors = allErrors.filter(e => e.severity === 'critical');
      const highErrors = allErrors.filter(e => e.severity === 'high');
      const warnings = allErrors.filter(e => e.severity === 'medium' || e.severity === 'low');
      
      const isValid = criticalErrors.length === 0;
      
      console.log(`✅ Validation completed in ${duration}ms`);
      console.log(`   Critical: ${criticalErrors.length}, High: ${highErrors.length}, Warnings: ${warnings.length}`);
      
      // Calculate confidence (100% if no errors, decreases with issues)
      let confidence = 1.0;
      confidence -= criticalErrors.length * 0.3;
      confidence -= highErrors.length * 0.1;
      confidence -= warnings.length * 0.02;
      confidence = Math.max(0, Math.min(1, confidence));
      
      return {
        isValid,
        errors: [...criticalErrors, ...highErrors],
        warnings,
        duration,
        confidence
      };
    } catch (error: any) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [{
          severity: 'critical',
          type: 'validation_error',
          file: 'validation',
          message: `Validation failed: ${error.message}`
        }],
        warnings: [],
        duration: Date.now() - start,
        confidence: 0
      };
    }
  }
  
  /**
   * Layer 1: Syntax Validation
   */
  private async validateSyntax(
    files: GeneratedFile[],
    language: string
  ): Promise<ValidationError[]> {
    
    const errors: ValidationError[] = [];
    
    // Validate each file in parallel for speed
    const validationPromises = files.map(async (file) => {
      try {
        switch (language.toLowerCase()) {
          case 'typescript':
          case 'javascript':
            return await this.validateJSSyntax(file);
          case 'python':
            return await this.validatePythonSyntax(file);
          default:
            return [];
        }
      } catch (error: any) {
        return [{
          severity: 'critical' as const,
          type: 'syntax_error',
          file: file.path,
          message: `Syntax check failed: ${error.message}`
        }];
      }
    });
    
    const results = await Promise.all(validationPromises);
    results.forEach(result => errors.push(...result));
    
    return errors;
  }
  
  /**
   * Validate JavaScript/TypeScript syntax using TypeScript compiler
   */
  private async validateJSSyntax(file: GeneratedFile): Promise<ValidationError[]> {
    // Skip non-JS/TS files
    if (!file.path.match(/\.(ts|tsx|js|jsx)$/)) {
      return [];
    }
    
    try {
      const ts = await import('typescript');
      
      // Quick syntax check using transpileModule
      const result = ts.transpileModule(file.content, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
          noEmit: true,
          skipLibCheck: true
        },
        reportDiagnostics: true
      });
      
      // Convert diagnostics to errors
      const errors: ValidationError[] = [];
      
      if (result.diagnostics && result.diagnostics.length > 0) {
        for (const diagnostic of result.diagnostics) {
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          
          errors.push({
            severity: 'critical',
            type: 'syntax_error',
            file: file.path,
            line: diagnostic.start !== undefined 
              ? this.getLineNumber(file.content, diagnostic.start) 
              : undefined,
            message: message
          });
        }
      }
      
      return errors;
    } catch (error: any) {
      return [{
        severity: 'critical',
        type: 'syntax_error',
        file: file.path,
        message: `TypeScript validation failed: ${error.message}`
      }];
    }
  }
  
  /**
   * Validate Python syntax using Pylance MCP
   */
  private async validatePythonSyntax(file: GeneratedFile): Promise<ValidationError[]> {
    // Skip non-Python files
    if (!file.path.endsWith('.py')) {
      return [];
    }
    
    try {
      // TODO: Use Pylance MCP for fast Python syntax validation when available
      // For now, use basic syntax check
      return this.basicPythonSyntaxCheck(file);
    } catch (error: any) {
      // Fallback: basic Python syntax check
      return this.basicPythonSyntaxCheck(file);
    }
  }
  
  /**
   * Basic Python syntax check (fallback)
   */
  private basicPythonSyntaxCheck(file: GeneratedFile): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = file.content.split('\n');
    
    // Check for obvious syntax errors
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check for unmatched brackets/parentheses
      const openBrackets = (line.match(/[({[]/g) || []).length;
      const closeBrackets = (line.match(/[)}\]]/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        errors.push({
          severity: 'high',
          type: 'syntax_error',
          file: file.path,
          line: lineNum,
          message: 'Possibly unmatched brackets/parentheses'
        });
      }
      
      // Check for invalid indentation
      const indentMatch = line.match(/^\s+/);
      if (line.match(/^\s+\S/) && indentMatch && indentMatch[0].length % 4 !== 0) {
        errors.push({
          severity: 'medium',
          type: 'syntax_error',
          file: file.path,
          line: lineNum,
          message: 'Inconsistent indentation (use 4 spaces)'
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Layer 2: Dependency Validation
   */
  private async validateDependencies(
    files: GeneratedFile[],
    language: string
  ): Promise<ValidationError[]> {
    
    const errors: ValidationError[] = [];
    
    // Find package file
    const packageFile = files.find(f => 
      f.path === 'package.json' || 
      f.path === 'requirements.txt' ||
      f.path === 'Cargo.toml' ||
      f.path === 'go.mod'
    );
    
    // Check if package file is required
    if (!packageFile) {
      if (language === 'typescript' || language === 'javascript') {
        errors.push({
          severity: 'critical',
          type: 'missing_file',
          file: 'package.json',
          message: 'Missing package.json for TypeScript/JavaScript project',
          suggestedFix: 'Add package.json with dependencies'
        });
      } else if (language === 'python') {
        errors.push({
          severity: 'high',
          type: 'missing_file',
          file: 'requirements.txt',
          message: 'Missing requirements.txt for Python project',
          suggestedFix: 'Add requirements.txt with dependencies'
        });
      }
      return errors;
    }
    
    // Extract declared dependencies
    const declaredDeps = this.extractDependencies(packageFile, language);
    
    // Extract imports from all code files
    const usedImports = new Set<string>();
    for (const file of files) {
      if (this.isCodeFile(file.path, language)) {
        const imports = this.extractImports(file.content, language);
        imports.forEach(imp => usedImports.add(imp));
      }
    }
    
    // Check for missing dependencies
    for (const imp of usedImports) {
      if (!declaredDeps.has(imp) && !this.isBuiltIn(imp, language)) {
        errors.push({
          severity: 'high',
          type: 'missing_dependency',
          file: packageFile.path,
          message: `Import "${imp}" is used but not declared in dependencies`,
          suggestedFix: `Add "${imp}" to ${packageFile.path}`
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Layer 3: Critical Pattern Validation
   */
  private validatePatterns(
    files: GeneratedFile[],
    language: string
  ): ValidationError[] {
    
    const errors: ValidationError[] = [];
    const patterns = this.getCriticalPatterns(language);
    
    for (const file of files) {
      if (!this.isCodeFile(file.path, language)) continue;
      
      for (const pattern of patterns) {
        const matches = [...file.content.matchAll(pattern.regex)];
        
        for (const match of matches) {
          const line = this.getLineNumber(file.content, match.index || 0);
          
          errors.push({
            severity: pattern.severity,
            type: 'anti_pattern',
            file: file.path,
            line,
            message: pattern.message,
            suggestedFix: pattern.fix
          });
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Layer 4: File Structure Validation
   */
  private validateStructure(
    files: GeneratedFile[],
    language: string
  ): ValidationError[] {
    
    const errors: ValidationError[] = [];
    
    // Check for duplicate files
    const paths = files.map(f => f.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    
    for (const dup of duplicates) {
      errors.push({
        severity: 'critical',
        type: 'duplicate_file',
        file: dup,
        message: `Duplicate file: ${dup}`,
        suggestedFix: 'Remove duplicate file, keep only one version'
      });
    }
    
    // Check for empty files
    for (const file of files) {
      if (file.content.trim().length === 0) {
        errors.push({
          severity: 'high',
          type: 'empty_file',
          file: file.path,
          message: 'File is empty',
          suggestedFix: 'Remove empty file or add content'
        });
      }
    }
    
    // Check for placeholder files (.gitkeep, etc.)
    for (const file of files) {
      if (file.path.includes('.gitkeep')) {
        errors.push({
          severity: 'medium',
          type: 'placeholder_file',
          file: file.path,
          message: 'Contains .gitkeep placeholder file',
          suggestedFix: 'Remove .gitkeep files'
        });
      }
    }
    
    // Language-specific structure checks
    if (language === 'typescript' || language === 'javascript') {
      this.validateJSStructure(files, errors);
    } else if (language === 'python') {
      this.validatePythonStructure(files, errors);
    }
    
    return errors;
  }
  
  private validateJSStructure(files: GeneratedFile[], errors: ValidationError[]): void {
    const hasTsFiles = files.some(f => f.path.match(/\.tsx?$/));
    const hasPackageJson = files.some(f => f.path === 'package.json');
    const hasTsConfig = files.some(f => f.path === 'tsconfig.json');
    
    if (hasTsFiles && !hasTsConfig) {
      errors.push({
        severity: 'critical',
        type: 'missing_config',
        file: 'tsconfig.json',
        message: 'TypeScript files present but tsconfig.json is missing',
        suggestedFix: 'Add tsconfig.json configuration file'
      });
    }
    
    if (!hasPackageJson) {
      errors.push({
        severity: 'critical',
        type: 'missing_config',
        file: 'package.json',
        message: 'package.json is required for JavaScript/TypeScript projects',
        suggestedFix: 'Add package.json with dependencies and scripts'
      });
    }
  }
  
  private validatePythonStructure(files: GeneratedFile[], errors: ValidationError[]): void {
    const hasPythonFiles = files.some(f => f.path.endsWith('.py'));
    const hasRequirements = files.some(f => f.path === 'requirements.txt');
    
    if (hasPythonFiles && !hasRequirements) {
      errors.push({
        severity: 'high',
        type: 'missing_config',
        file: 'requirements.txt',
        message: 'Python project should have requirements.txt',
        suggestedFix: 'Add requirements.txt with dependencies'
      });
    }
  }
  
  /**
   * Get critical patterns to check for each language
   */
  private getCriticalPatterns(language: string): ValidationPattern[] {
    // Common patterns across all languages
    const common: ValidationPattern[] = [
      {
        regex: /\.\.\.existing code\.\.\./gi,
        severity: 'critical',
        message: 'Contains placeholder "...existing code..."',
        fix: 'Replace placeholder with actual implementation'
      },
      {
        regex: /TODO:\s*[Ii]mplement/g,
        severity: 'high',
        message: 'Contains unimplemented TODO',
        fix: 'Implement the functionality or remove TODO'
      },
      {
        regex: /FIXME/gi,
        severity: 'medium',
        message: 'Contains FIXME comment',
        fix: 'Fix the issue or remove comment'
      }
    ];
    
    if (language === 'typescript' || language === 'javascript') {
      return [
        ...common,
        {
          regex: /:\s*any\b/g,
          severity: 'medium',
          message: 'Uses "any" type - reduces type safety',
          fix: 'Use specific types instead of any'
        },
        {
          regex: /console\.log\(/g,
          severity: 'low',
          message: 'Contains console.log (debugging code)',
          fix: 'Remove or replace with proper logging'
        }
      ];
    }
    
    if (language === 'python') {
      return [
        ...common,
        {
          regex: /print\(/g,
          severity: 'low',
          message: 'Contains print() statement (debugging code)',
          fix: 'Remove or replace with proper logging'
        }
      ];
    }
    
    return common;
  }
  
  /**
   * Helper: Extract imports from code
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Match: import ... from 'package'
      const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const pkg = match[1];
        
        // Skip relative imports
        if (pkg.startsWith('.') || pkg.startsWith('/')) continue;
        
        // Extract package name (handle @scoped packages)
        const pkgName = pkg.startsWith('@') 
          ? pkg.split('/').slice(0, 2).join('/')
          : pkg.split('/')[0];
        
        imports.push(pkgName);
      }
    } else if (language === 'python') {
      // Match: import package or from package import ...
      const importRegex = /(?:^|\n)(?:from\s+(\w+)|import\s+(\w+))/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const pkg = match[1] || match[2];
        imports.push(pkg);
      }
    }
    
    return [...new Set(imports)];
  }
  
  /**
   * Helper: Extract dependencies from package file
   */
  private extractDependencies(file: GeneratedFile, language: string): Set<string> {
    const deps = new Set<string>();
    
    try {
      if (language === 'typescript' || language === 'javascript') {
        const pkg = JSON.parse(file.content);
        Object.keys(pkg.dependencies || {}).forEach(d => deps.add(d));
        Object.keys(pkg.devDependencies || {}).forEach(d => deps.add(d));
      } else if (language === 'python') {
        // Parse requirements.txt
        const lines = file.content.split('\n');
        lines.forEach(line => {
          const cleaned = line.trim().split('#')[0]; // Remove comments
          const pkg = cleaned.split('==')[0].split('>=')[0].split('<=')[0].trim();
          if (pkg) deps.add(pkg);
        });
      }
    } catch (error) {
      console.warn(`Failed to parse dependencies from ${file.path}:`, error);
    }
    
    return deps;
  }
  
  /**
   * Helper: Check if a package is built-in
   */
  private isBuiltIn(pkg: string, language: string): boolean {
    if (language === 'typescript' || language === 'javascript') {
      const builtIns = [
        'fs', 'path', 'http', 'https', 'crypto', 'util', 'events', 
        'stream', 'buffer', 'url', 'querystring', 'zlib', 'os', 'process'
      ];
      return builtIns.includes(pkg);
    }
    
    if (language === 'python') {
      const builtIns = [
        'os', 'sys', 'json', 'datetime', 're', 'math', 'random',
        'collections', 'itertools', 'functools', 'typing', 'pathlib'
      ];
      return builtIns.includes(pkg);
    }
    
    return false;
  }
  
  /**
   * Helper: Check if file is a code file
   */
  private isCodeFile(path: string, language: string): boolean {
    if (language === 'typescript' || language === 'javascript') {
      return path.match(/\.(ts|tsx|js|jsx)$/) !== null;
    }
    
    if (language === 'python') {
      return path.endsWith('.py');
    }
    
    return false;
  }
  
  /**
   * Helper: Get line number from string offset
   */
  private getLineNumber(content: string, offset: number): number {
    return content.substring(0, offset).split('\n').length;
  }
}
