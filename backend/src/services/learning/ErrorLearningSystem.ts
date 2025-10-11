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
      patterns: [],
      languageSpecificRules: {},
      frameworkSpecificRules: {},
      platformSpecificRules: {},
      globalBestPractices: [
        'Always validate generated code before deployment',
        'Include all dependencies with proper versions',
        'Follow language-specific conventions and idioms',
        'Write defensive code with proper error handling',
        'Test code in target environment before finalizing'
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
