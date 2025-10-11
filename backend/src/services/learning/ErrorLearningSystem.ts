/**
 * Error Learning System - Self-improving AI code generation
 * 
 * This system learns from deployment failures and improves code generation over time
 * Works with ANY language, framework, or platform
 * 
 * Architecture:
 * 1. Capture deployment errors automatically
 * 2. Analyze error patterns with AI
 * 3. Generate fix strategies
 * 4. Build knowledge base
 * 5. Apply learnings to future generations
 */

import { AgentBuilder } from '@iqai/adk';
import { z } from 'zod';

export interface DeploymentError {
  id: string;
  timestamp: Date;
  language: string;
  framework?: string;
  platform: string; // 'fly.io', 'vercel', 'heroku', etc.
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  buildLogs?: string;
  filesInvolved: string[];
  userPrompt: string;
  fixAttempts: number;
  resolved: boolean;
  appliedFix?: string;
}

export interface ErrorPattern {
  id: string;
  category: string;
  languages: string[];
  frameworks: string[];
  platforms: string[];
  errorSignatures: string[]; // Regex patterns to match errors
  commonCauses: string[];
  preventionRules: string[];
  fixStrategies: string[];
  occurrenceCount: number;
  successRate: number;
  lastSeen: Date;
  examples: string[];
}

export interface KnowledgeBase {
  version: string;
  lastUpdated: Date;
  patterns: ErrorPattern[];
  languageSpecificRules: Record<string, string[]>;
  frameworkSpecificRules: Record<string, string[]>;
  platformSpecificRules: Record<string, string[]>;
  globalBestPractices: string[];
}

/**
 * Main Error Learning System
 */
export class ErrorLearningSystem {
  private knowledgeBase: KnowledgeBase;
  private errorHistory: DeploymentError[] = [];

  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    // Load from database asynchronously
    this.loadKnowledgeBaseFromStorage().catch(err => {
      console.warn('[ErrorLearningSystem] Failed to load from storage, using defaults:', err);
    });
  }

  /**
   * Load knowledge base from Supabase on startup
   */
  private async loadKnowledgeBaseFromStorage(): Promise<void> {
    try {
      const { getSupabaseStorage } = await import('./SupabaseLearningStorage');
      const storage = getSupabaseStorage();
      const loadedKB = await storage.loadKnowledgeBase();
      
      // Merge with defaults (in case storage is empty)
      if (loadedKB.patterns.length > 0 || Object.keys(loadedKB.languageSpecificRules).length > 0) {
        this.knowledgeBase = {
          ...loadedKB,
          globalBestPractices: [
            ...this.knowledgeBase.globalBestPractices,
            ...loadedKB.globalBestPractices
          ]
        };
        console.log(`📚 [ErrorLearningSystem] Loaded knowledge base from storage:`);
        console.log(`   - ${loadedKB.patterns.length} patterns`);
        console.log(`   - ${Object.keys(loadedKB.languageSpecificRules).length} language rule sets`);
        console.log(`   - ${Object.keys(loadedKB.frameworkSpecificRules).length} framework rule sets`);
        console.log(`   - ${Object.keys(loadedKB.platformSpecificRules).length} platform rule sets`);
      }
    } catch (error) {
      console.warn('[ErrorLearningSystem] Storage not available, using in-memory only');
    }
  }

  /**
   * Capture and learn from a deployment error
   */
  async captureError(error: DeploymentError): Promise<void> {
    console.log(`\n📚 [Learning System] Capturing error: ${error.errorType}`);
    
    this.errorHistory.push(error);

    // Analyze error with AI to understand the root cause
    const analysis = await this.analyzeErrorWithAI(error);
    
    // Update or create error pattern
    await this.updateErrorPattern(error, analysis);
    
    // Generate prevention rules
    await this.generatePreventionRules(error, analysis);
    
    // Save updated knowledge base
    await this.saveKnowledgeBase();
    
    console.log(`✅ [Learning System] Error captured and learned`);
  }

  /**
   * Use AI to deeply analyze an error
   */
  private async analyzeErrorWithAI(error: DeploymentError): Promise<any> {
    // Build instruction text BEFORE AgentBuilder to avoid template injection issues
    const errorType = error.errorType;
    const language = error.language;
    const framework = error.framework || 'Not specified';
    const platform = error.platform;
    const errorMessage = error.errorMessage;
    const buildLogs = error.buildLogs?.slice(-2000) || 'Not available';
    const filesInvolved = error.filesInvolved.join(', ');
    
    const instructionText = 'You are an expert software engineer analyzing deployment errors.\n\n' +
      'Analyze the following deployment error and provide insights:\n\n' +
      'Error Type: ' + errorType + '\n' +
      'Language: ' + language + '\n' +
      'Framework: ' + framework + '\n' +
      'Platform: ' + platform + '\n' +
      'Error Message: ' + errorMessage + '\n\n' +
      'Build Logs:\n' + buildLogs + '\n\n' +
      'Files Involved: ' + filesInvolved + '\n\n' +
      'Provide:\n' +
      '1. Root cause analysis (what actually caused this error)\n' +
      '2. Category (dependency, syntax, configuration, module system, etc.)\n' +
      '3. Prevention strategy (how to prevent this in future code generation)\n' +
      '4. Fix strategy (how to automatically fix this type of error)\n' +
      '5. Related error patterns (similar errors that might occur)\n' +
      '6. Specific rules for this language/framework/platform\n\n' +
      'Be specific and actionable. Focus on patterns that can be automated.';

    const { runner } = await AgentBuilder.create('ErrorAnalysisAgent')
      .withModel('gpt-5-nano')
      .withInstruction(instructionText)
      .withOutputSchema(z.object({
        rootCause: z.string(),
        category: z.string(),
        preventionStrategy: z.string(),
        fixStrategy: z.string(),
        relatedPatterns: z.array(z.string()),
        specificRules: z.array(z.string()),
        errorSignature: z.string() // Regex pattern to match similar errors
      }) as z.ZodTypeAny)
      .build();

    const result = await runner.ask('Analyze this deployment error and help me prevent it in the future.');
    
    return result;
  }

  /**
   * Update or create error pattern in knowledge base
   */
  private async updateErrorPattern(error: DeploymentError, analysis: any): Promise<void> {
    const existingPattern = this.knowledgeBase.patterns.find(
      p => p.category === analysis.category && 
      p.errorSignatures.some(sig => new RegExp(sig).test(error.errorMessage))
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.occurrenceCount++;
      existingPattern.lastSeen = new Date();
      
      if (error.resolved && error.appliedFix) {
        existingPattern.successRate = (existingPattern.successRate + 1) / 2; // Running average
        if (!existingPattern.fixStrategies.includes(error.appliedFix)) {
          existingPattern.fixStrategies.push(error.appliedFix);
        }
      }
      
      // Add new rules from AI analysis
      for (const rule of analysis.specificRules) {
        if (!existingPattern.preventionRules.includes(rule)) {
          existingPattern.preventionRules.push(rule);
        }
      }
    } else {
      // Create new pattern
      const newPattern: ErrorPattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: analysis.category,
        languages: [error.language],
        frameworks: error.framework ? [error.framework] : [],
        platforms: [error.platform],
        errorSignatures: [analysis.errorSignature],
        commonCauses: [analysis.rootCause],
        preventionRules: analysis.specificRules,
        fixStrategies: [analysis.fixStrategy],
        occurrenceCount: 1,
        successRate: 0,
        lastSeen: new Date(),
        examples: [error.errorMessage]
      };
      
      this.knowledgeBase.patterns.push(newPattern);
    }
  }

  /**
   * Generate prevention rules that can be added to prompts
   */
  private async generatePreventionRules(error: DeploymentError, analysis: any): Promise<void> {
    // Add language-specific rules
    if (!this.knowledgeBase.languageSpecificRules[error.language]) {
      this.knowledgeBase.languageSpecificRules[error.language] = [];
    }
    
    for (const rule of analysis.specificRules) {
      if (!this.knowledgeBase.languageSpecificRules[error.language].includes(rule)) {
        this.knowledgeBase.languageSpecificRules[error.language].push(rule);
      }
    }

    // Add framework-specific rules
    if (error.framework) {
      if (!this.knowledgeBase.frameworkSpecificRules[error.framework]) {
        this.knowledgeBase.frameworkSpecificRules[error.framework] = [];
      }
      
      for (const rule of analysis.specificRules) {
        if (!this.knowledgeBase.frameworkSpecificRules[error.framework].includes(rule)) {
          this.knowledgeBase.frameworkSpecificRules[error.framework].push(rule);
        }
      }
    }

    // Add platform-specific rules
    if (!this.knowledgeBase.platformSpecificRules[error.platform]) {
      this.knowledgeBase.platformSpecificRules[error.platform] = [];
    }
    
    const platformRule = `[${error.platform.toUpperCase()}] ${analysis.preventionStrategy}`;
    if (!this.knowledgeBase.platformSpecificRules[error.platform].includes(platformRule)) {
      this.knowledgeBase.platformSpecificRules[error.platform].push(platformRule);
    }
  }

  /**
   * Get relevant rules for a specific generation request
   */
  getDynamicRulesForGeneration(context: {
    language: string;
    framework?: string;
    platform?: string;
    prompt: string;
  }): string {
    let rules = '\n\n## LEARNED RULES (Auto-generated from past errors):\n\n';

    // 1. Language-specific rules
    const langRules = this.knowledgeBase.languageSpecificRules[context.language] || [];
    if (langRules.length > 0) {
      rules += `### ${context.language.toUpperCase()} Best Practices:\n`;
      langRules.forEach((rule, idx) => {
        rules += `${idx + 1}. ${rule}\n`;
      });
      rules += '\n';
    }

    // 2. Framework-specific rules
    if (context.framework) {
      const fwRules = this.knowledgeBase.frameworkSpecificRules[context.framework] || [];
      if (fwRules.length > 0) {
        rules += `### ${context.framework.toUpperCase()} Best Practices:\n`;
        fwRules.forEach((rule, idx) => {
          rules += `${idx + 1}. ${rule}\n`;
        });
        rules += '\n';
      }
    }

    // 3. Platform-specific rules
    if (context.platform) {
      const platRules = this.knowledgeBase.platformSpecificRules[context.platform] || [];
      if (platRules.length > 0) {
        rules += `### ${context.platform.toUpperCase()} Deployment Requirements:\n`;
        platRules.forEach((rule, idx) => {
          rules += `${idx + 1}. ${rule}\n`;
        });
        rules += '\n';
      }
    }

    // 4. Patterns relevant to this generation
    const relevantPatterns = this.knowledgeBase.patterns.filter(p => 
      p.languages.includes(context.language) &&
      (!context.framework || p.frameworks.includes(context.framework)) &&
      (!context.platform || p.platforms.includes(context.platform)) &&
      p.occurrenceCount > 1 // Only include patterns seen multiple times
    ).sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 10); // Top 10

    if (relevantPatterns.length > 0) {
      rules += '### CRITICAL: Common Errors to Avoid:\n';
      relevantPatterns.forEach((pattern, idx) => {
        rules += `${idx + 1}. [${pattern.category.toUpperCase()}] (Occurred ${pattern.occurrenceCount}x):\n`;
        pattern.preventionRules.forEach(rule => {
          rules += `   - ${rule}\n`;
        });
      });
      rules += '\n';
    }

    // 5. Global best practices (high success rate patterns)
    const globalRules = this.knowledgeBase.patterns
      .filter(p => p.successRate > 0.8 && p.occurrenceCount > 3)
      .flatMap(p => p.preventionRules)
      .filter((rule, idx, arr) => arr.indexOf(rule) === idx) // Unique
      .slice(0, 5);

    if (globalRules.length > 0) {
      rules += '### Universal Best Practices:\n';
      globalRules.forEach((rule, idx) => {
        rules += `${idx + 1}. ${rule}\n`;
      });
      rules += '\n';
    }

    rules += '⚠️ These rules were learned from actual deployment failures. Follow them strictly!\n\n';

    return rules;
  }

  /**
   * Get fix suggestions for a specific error
   */
  async getFixSuggestions(error: string, context: {
    language: string;
    framework?: string;
    platform?: string;
  }): Promise<string[]> {
    const suggestions: string[] = [];

    // Find matching patterns
    for (const pattern of this.knowledgeBase.patterns) {
      for (const signature of pattern.errorSignatures) {
        if (new RegExp(signature, 'i').test(error)) {
          suggestions.push(...pattern.fixStrategies);
          break;
        }
      }
    }

    // If no match, use AI to suggest fixes
    if (suggestions.length === 0) {
      // Build instruction text without template literals to avoid ADK injection issues
      const instructionText = 'Suggest 3 quick fixes for this error:\n' +
        'Error: ' + error + '\n' +
        'Language: ' + context.language + '\n' +
        'Framework: ' + (context.framework || 'N/A') + '\n' +
        'Platform: ' + (context.platform || 'N/A') + '\n\n' +
        'Provide specific, actionable fixes that can be automated.';

      const { runner } = await AgentBuilder.create('QuickFixAgent')
        .withModel('gpt-5-nano')
        .withInstruction(instructionText)
        .withOutputSchema(z.object({
          fixes: z.array(z.string())
        }) as z.ZodTypeAny)
        .build();

      const result = await runner.ask('Suggest fixes') as any;
      suggestions.push(...(result.fixes || []));
    }

    return suggestions;
  }

  /**
   * Initialize knowledge base with seed data
   */
  private initializeKnowledgeBase(): KnowledgeBase {
    return {
      version: '1.0.0',
      lastUpdated: new Date(),
      patterns: [
        // Common deployment crash patterns
        {
          id: 'pattern_deployment_crash_001',
          category: 'deployment_crash',
          languages: ['typescript', 'javascript', 'python', 'go', 'rust'],
          frameworks: [],
          platforms: ['fly.io', 'heroku', 'railway'],
          errorSignatures: [
            'smoke checks.*failed.*crashing',
            'app.*appears to be crashing',
            'deployment.*failed.*crash'
          ],
          commonCauses: [
            'Missing or incorrect start command',
            'Application exits immediately after startup',
            'Missing required environment variables',
            'Port binding issues',
            'Uncaught exception during initialization'
          ],
          preventionRules: [
            'Always verify the start command matches the main entry point',
            'Ensure the application binds to 0.0.0.0 (not localhost or 127.0.0.1)',
            'Add proper error handling in application initialization',
            'Check that all required dependencies are installed',
            'Verify PORT environment variable is read from process.env.PORT',
            'Add health check endpoint that responds to GET /',
            'Ensure application stays running (no process.exit() in initialization)'
          ],
          fixStrategies: [
            'Fix package.json start script to use correct entry point',
            'Change server listen from localhost to 0.0.0.0',
            'Add try-catch around initialization code',
            'Add missing dependencies to package.json',
            'Use process.env.PORT || 8080 for port configuration'
          ],
          occurrenceCount: 0,
          successRate: 0.75,
          lastSeen: new Date(),
          examples: ['smoke checks for 6e827563f47798 failed: the app appears to be crashing']
        },
        {
          id: 'pattern_health_check_fail_001',
          category: 'deployment_health_check_failed',
          languages: ['typescript', 'javascript', 'python', 'go'],
          frameworks: ['express', 'fastapi', 'next.js'],
          platforms: ['fly.io', 'railway'],
          errorSignatures: [
            'health check.*failed',
            'smoke checks.*failed',
            'failed.*respond.*health'
          ],
          commonCauses: [
            'No route handler for root path /',
            'Application not listening on correct port',
            'Health check timeout too short',
            'Application takes too long to start'
          ],
          preventionRules: [
            'Always add a GET / route that returns 200 OK',
            'Ensure server starts before health check runs',
            'Keep initialization code fast and async',
            'Return simple JSON response from health endpoint'
          ],
          fixStrategies: [
            'Add app.get("/", (req, res) => res.json({ status: "ok" }))',
            'Reduce startup time by deferring heavy initialization',
            'Increase health check grace period in fly.toml'
          ],
          occurrenceCount: 0,
          successRate: 0.85,
          lastSeen: new Date(),
          examples: ['Health check on port 8080 failed']
        },
        {
          id: 'pattern_missing_dependency_001',
          category: 'missing_dependency',
          languages: ['typescript', 'javascript', 'python'],
          frameworks: [],
          platforms: ['fly.io', 'vercel', 'heroku'],
          errorSignatures: [
            'cannot find module',
            'module not found',
            'no module named',
            'modulenotfounderror',
            'no matching version',
            'notarget',
            'couldn.*t find any versions',
            'package not found',
            'could not resolve'
          ],
          commonCauses: [
            'Dependency not listed in package.json or requirements.txt',
            'Import path typo',
            'Missing devDependencies in production build',
            'Invalid package version (version does not exist on npm)',
            'Typo in package version number'
          ],
          preventionRules: [
            'Always add imports to dependencies in package.json',
            'Use correct import paths relative to project structure',
            'Move build tools from devDependencies to dependencies if needed at runtime',
            'Double-check spelling of module names',
            'CRITICAL: Always verify package versions exist on npm before using them',
            'Use version ranges like ^4.17.0 or ~4.17.0 instead of exact micro versions',
            'For @types packages, use latest compatible version or omit patch version',
            'Check npm registry before specifying exact versions (e.g., @types/express@^4.17.21 not ^4.17.25)'
          ],
          fixStrategies: [
            'Add missing module to package.json dependencies',
            'Fix import path to match actual file location',
            'Move typescript/build tools to dependencies if used in start script',
            'Correct invalid package version to a version that exists on npm',
            'Use version range (^X.Y.0) instead of specific patch version',
            'For @types packages, use ^4.17.0 or latest available version'
          ],
          occurrenceCount: 0,
          successRate: 0.95,
          lastSeen: new Date(),
          examples: [
            'Error: Cannot find module \'express\'',
            'npm error notarget No matching version found for @types/express@^4.17.25',
            'Couldn\'t find any versions for "@types/node" that matches "^20.99.0"'
          ]
        },
        {
          id: 'pattern_port_binding_001',
          category: 'port_conflict',
          languages: ['typescript', 'javascript', 'python', 'go'],
          frameworks: ['express', 'fastapi', 'gin'],
          platforms: ['fly.io', 'railway', 'heroku'],
          errorSignatures: [
            'eaddrinuse',
            'address already in use',
            'port.*already.*use',
            'bind.*failed'
          ],
          commonCauses: [
            'Hardcoded port instead of using environment variable',
            'Multiple servers trying to bind to same port',
            'Previous instance not cleaned up'
          ],
          preventionRules: [
            'Always use process.env.PORT for port configuration',
            'Provide a fallback default port (e.g., 8080)',
            'Only create one server instance',
            'Use PORT=0.0.0.0:${PORT} in fly.toml'
          ],
          fixStrategies: [
            'Change port to: const port = process.env.PORT || 8080',
            'Ensure only one server.listen() call',
            'Update fly.toml to use [[services.ports]] correctly'
          ],
          occurrenceCount: 0,
          successRate: 0.90,
          lastSeen: new Date(),
          examples: ['Error: listen EADDRINUSE: address already in use :::3000']
        }
      ],
      languageSpecificRules: {
        'typescript': [
          'Use strict type checking to catch errors early',
          'Compile TypeScript before deployment (include typescript as dependency)',
          'Set "module": "commonjs" or "nodenext" in tsconfig.json for Node.js'
        ],
        'javascript': [
          'Use ES modules or CommonJS consistently throughout project',
          'Avoid mixing require() and import statements'
        ],
        'python': [
          'Include all imports in requirements.txt with versions',
          'Use __name__ == "__main__" guard for executable scripts',
          'Set PYTHONUNBUFFERED=1 for better logging'
        ]
      },
      frameworkSpecificRules: {
        'express': [
          'Always define a GET / route for health checks',
          'Use app.listen(PORT, "0.0.0.0") not localhost',
          'Add error handling middleware with app.use((err, req, res, next) => ...)'
        ],
        'next.js': [
          'Use "next start" not "next dev" in production',
          'Set NODE_ENV=production',
          'Include all required dependencies including next itself'
        ],
        'fastapi': [
          'Use uvicorn with --host 0.0.0.0',
          'Include uvicorn[standard] in requirements.txt',
          'Add @app.get("/") health check endpoint'
        ]
      },
      platformSpecificRules: {
        'fly.io': [
          'Bind to 0.0.0.0 not localhost',
          'Use internal_port = 8080 in fly.toml [[services]]',
          'Add health check endpoint at GET /',
          'Keep app startup time under 60 seconds',
          'Use process.env.PORT for port configuration'
        ],
        'heroku': [
          'Use process.env.PORT for port',
          'Define Procfile with web process type',
          'Include engines field in package.json with Node version'
        ]
      },
      globalBestPractices: [
        'Always validate generated code before deployment',
        'Include all dependencies with proper versions',
        'Follow language-specific conventions and idioms',
        'Write defensive code with proper error handling',
        'Test code in target environment before finalizing',
        'Bind servers to 0.0.0.0 not localhost for cloud deployments',
        'Use environment variables for configuration (PORT, NODE_ENV, etc.)',
        'Add health check endpoints that respond to GET /',
        'Keep application startup fast and non-blocking',
        'Handle errors gracefully without crashing the process'
      ]
    };
  }

  /**
   * Save knowledge base to persistent storage
   */
  private async saveKnowledgeBase(): Promise<void> {
    this.knowledgeBase.lastUpdated = new Date();
    
    // Save to Supabase for persistence
    try {
      const { getSupabaseStorage } = await import('./SupabaseLearningStorage');
      const storage = getSupabaseStorage();
      
      // Save all language rules
      for (const [lang, rules] of Object.entries(this.knowledgeBase.languageSpecificRules)) {
        await storage.saveLanguageRules(lang, rules, ['auto-learned']);
      }
      
      // Save all framework rules
      for (const [fw, rules] of Object.entries(this.knowledgeBase.frameworkSpecificRules)) {
        const lang = this.knowledgeBase.patterns.find(p => p.frameworks.includes(fw))?.languages[0] || 'unknown';
        await storage.saveFrameworkRules(fw, lang, rules, ['auto-learned']);
      }
      
      // Save all platform rules
      for (const [platform, rules] of Object.entries(this.knowledgeBase.platformSpecificRules)) {
        await storage.savePlatformRules(platform, rules, ['auto-learned']);
      }
    } catch (error) {
      console.warn('[ErrorLearningSystem] Failed to save to Supabase:', error);
      // Continue with in-memory operation
    }
  }

  /**
   * Export knowledge base for analysis
   */
  exportKnowledgeBase(): KnowledgeBase {
    return { ...this.knowledgeBase };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const totalErrors = this.errorHistory.length;
    const resolvedErrors = this.errorHistory.filter(e => e.resolved).length;
    const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

    const errorsByCategory = this.knowledgeBase.patterns.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.occurrenceCount;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = this.knowledgeBase.patterns
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 5);

    return {
      totalErrors,
      resolvedErrors,
      resolutionRate: resolutionRate.toFixed(2) + '%',
      totalPatterns: this.knowledgeBase.patterns.length,
      errorsByCategory,
      topErrors: topErrors.map(p => ({
        category: p.category,
        count: p.occurrenceCount,
        successRate: (p.successRate * 100).toFixed(2) + '%'
      })),
      lastUpdated: this.knowledgeBase.lastUpdated
    };
  }
}

// Singleton instance
let learningSystemInstance: ErrorLearningSystem | null = null;

export function getLearningSystem(): ErrorLearningSystem {
  if (!learningSystemInstance) {
    learningSystemInstance = new ErrorLearningSystem();
  }
  return learningSystemInstance;
}
