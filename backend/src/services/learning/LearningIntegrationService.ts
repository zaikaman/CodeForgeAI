/**
 * Learning Integration Service
 * Connects ErrorLearningSystem with the code generation workflow
 */

import { getLearningSystem, DeploymentError } from './ErrorLearningSystem';
import type { GeneratedFile } from '../validation/ComprehensiveValidator';

export class LearningIntegrationService {
  private learningSystem = getLearningSystem();

  /**
   * Get dynamic, learned rules for code generation
   */
  async getSmartPromptAddition(context: {
    language: string;
    framework?: string;
    platform?: string;
    prompt: string;
  }): Promise<string> {
    console.log(`📚 [Learning] Fetching learned rules for ${context.language}`);
    
    const dynamicRules = this.learningSystem.getDynamicRulesForGeneration(context);
    
    return dynamicRules;
  }

  /**
   * Capture deployment error for learning
   */
  async captureDeploymentError(error: {
    language: string;
    framework?: string;
    platform: string;
    errorMessage: string;
    buildLogs?: string;
    files: GeneratedFile[];
    userPrompt: string;
    fixAttempts: number;
  }): Promise<void> {
    const deploymentError: DeploymentError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      language: error.language,
      framework: error.framework,
      platform: error.platform,
      errorType: this.classifyError(error.errorMessage),
      errorMessage: error.errorMessage,
      buildLogs: error.buildLogs,
      filesInvolved: error.files.map(f => f.path),
      userPrompt: error.userPrompt,
      fixAttempts: error.fixAttempts,
      resolved: false
    };

    await this.learningSystem.captureError(deploymentError);
  }

  /**
   * Mark an error as resolved with the fix applied
   */
  async markErrorResolved(errorId: string, appliedFix: string): Promise<void> {
    console.log(`✅ [Learning] Marked error ${errorId} as resolved with fix: ${appliedFix}`);
    
    try {
      const { getSupabaseStorage } = await import('./SupabaseLearningStorage');
      const storage = getSupabaseStorage();
      await storage.markErrorResolved(errorId, appliedFix);
    } catch (error) {
      console.warn('[Learning] Failed to mark error as resolved in database:', error);
    }
  }

  /**
   * Get smart fix suggestions based on learned patterns
   */
  async getSmartFixSuggestions(error: string, context: {
    language: string;
    framework?: string;
    platform?: string;
  }): Promise<string[]> {
    return await this.learningSystem.getFixSuggestions(error, context);
  }

  /**
   * Get statistics about the learning system
   */
  getStatistics() {
    return this.learningSystem.getStatistics();
  }

  /**
   * Export knowledge base for inspection
   */
  exportKnowledgeBase() {
    return this.learningSystem.exportKnowledgeBase();
  }

  /**
   * Classify error type from message
   */
  private classifyError(errorMessage: string): string {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('cannot find module') || msg.includes('module not found')) {
      return 'missing_dependency';
    }
    if (msg.includes('syntax error') || msg.includes('unexpected token')) {
      return 'syntax_error';
    }
    if (msg.includes('type error') || msg.includes('is not assignable')) {
      return 'type_error';
    }
    if (msg.includes('module.exports') || msg.includes('require is not defined')) {
      return 'module_system_error';
    }
    if (msg.includes('unterminated') || msg.includes('unclosed')) {
      return 'string_literal_error';
    }
    if (msg.includes('property') && msg.includes('does not exist')) {
      return 'property_error';
    }
    if (msg.includes('build') || msg.includes('compilation')) {
      return 'build_error';
    }
    if (msg.includes('port') || msg.includes('eaddrinuse')) {
      return 'runtime_error';
    }

    return 'unknown_error';
  }

  /**
   * Detect language from user prompt or files
   */
  detectLanguage(prompt: string, files?: GeneratedFile[]): string {
    const promptLower = prompt.toLowerCase();

    // Check explicit language mentions
    if (promptLower.includes('typescript') || promptLower.includes('react') || promptLower.includes('next')) {
      return 'typescript';
    }
    if (promptLower.includes('python') || promptLower.includes('django') || promptLower.includes('flask')) {
      return 'python';
    }
    if (promptLower.includes('java') && !promptLower.includes('javascript')) {
      return 'java';
    }
    if (promptLower.includes('go') || promptLower.includes('golang')) {
      return 'go';
    }
    if (promptLower.includes('rust')) {
      return 'rust';
    }

    // Check from files
    if (files && files.length > 0) {
      const extensions = files.map(f => f.path.split('.').pop());
      if (extensions.some(ext => ['ts', 'tsx'].includes(ext || ''))) return 'typescript';
      if (extensions.some(ext => ['js', 'jsx'].includes(ext || ''))) return 'javascript';
      if (extensions.some(ext => ext === 'py')) return 'python';
      if (extensions.some(ext => ext === 'java')) return 'java';
      if (extensions.some(ext => ext === 'go')) return 'go';
      if (extensions.some(ext => ext === 'rs')) return 'rust';
    }

    return 'typescript'; // Default
  }

  /**
   * Detect framework from prompt or files
   */
  detectFramework(prompt: string, files?: GeneratedFile[]): string | undefined {
    const promptLower = prompt.toLowerCase();

    if (promptLower.includes('next.js') || promptLower.includes('nextjs')) return 'next.js';
    if (promptLower.includes('react')) return 'react';
    if (promptLower.includes('vue')) return 'vue';
    if (promptLower.includes('angular')) return 'angular';
    if (promptLower.includes('express')) return 'express';
    if (promptLower.includes('fastapi')) return 'fastapi';
    if (promptLower.includes('django')) return 'django';
    if (promptLower.includes('flask')) return 'flask';

    // Check from files
    if (files && files.length > 0) {
      const hasNextConfig = files.some(f => f.path.includes('next.config'));
      const hasViteConfig = files.some(f => f.path.includes('vite.config'));
      const hasAngularJson = files.some(f => f.path === 'angular.json');

      if (hasNextConfig) return 'next.js';
      if (hasViteConfig) return 'vite';
      if (hasAngularJson) return 'angular';
    }

    return undefined;
  }
}

// Singleton instance
let integrationServiceInstance: LearningIntegrationService | null = null;

export function getLearningIntegration(): LearningIntegrationService {
  if (!integrationServiceInstance) {
    integrationServiceInstance = new LearningIntegrationService();
  }
  return integrationServiceInstance;
}
