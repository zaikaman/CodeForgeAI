/**
 * Supabase Learning Storage
 * Persistent storage for the error learning system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DeploymentError, ErrorPattern, KnowledgeBase } from './ErrorLearningSystem';

export class SupabaseLearningStorage {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    // Accept both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_KEY for flexibility
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Save a deployment error to database
   */
  async saveError(error: DeploymentError): Promise<void> {
    const { error: dbError } = await this.supabase
      .from('error_history')
      .insert({
        timestamp: error.timestamp.toISOString(),
        language: error.language,
        framework: error.framework || null,
        platform: error.platform,
        error_type: error.errorType,
        error_message: error.errorMessage,
        error_stack: error.errorStack || null,
        build_logs: error.buildLogs || null,
        files_involved: error.filesInvolved,
        user_prompt: error.userPrompt,
        fix_attempts: error.fixAttempts,
        resolved: error.resolved,
        applied_fix: error.appliedFix || null,
        resolution_time: null,
        user_id: null,
        generation_id: error.id
      });

    if (dbError) {
      console.error('[Supabase] Error saving error history:', dbError);
      throw dbError;
    }

    // Update metadata
    await this.incrementErrorCount();
  }

  /**
   * Mark an error as resolved
   */
  async markErrorResolved(errorId: string, appliedFix: string): Promise<void> {
    const { error } = await this.supabase
      .from('error_history')
      .update({
        resolved: true,
        applied_fix: appliedFix
      })
      .eq('generation_id', errorId);

    if (error) {
      console.error('[Supabase] Error marking error as resolved:', error);
      throw error;
    }

    // Update metadata
    await this.incrementResolvedCount();
  }

  /**
   * Save or update an error pattern
   */
  async savePattern(pattern: ErrorPattern): Promise<void> {
    // Try to find existing pattern by category and signature
    const { data: existingPatterns } = await this.supabase
      .from('error_patterns')
      .select('*')
      .eq('category', pattern.category)
      .limit(1);

    if (existingPatterns && existingPatterns.length > 0) {
      // Update existing pattern
      const existing = existingPatterns[0];
      const { error } = await this.supabase
        .from('error_patterns')
        .update({
          languages: Array.from(new Set([...existing.languages, ...pattern.languages])),
          frameworks: Array.from(new Set([...existing.frameworks, ...pattern.frameworks])),
          platforms: Array.from(new Set([...existing.platforms, ...pattern.platforms])),
          error_signatures: Array.from(new Set([...existing.error_signatures, ...pattern.errorSignatures])),
          common_causes: Array.from(new Set([...existing.common_causes, ...pattern.commonCauses])),
          prevention_rules: Array.from(new Set([...existing.prevention_rules, ...pattern.preventionRules])),
          fix_strategies: Array.from(new Set([...existing.fix_strategies, ...pattern.fixStrategies])),
          occurrence_count: existing.occurrence_count + 1,
          success_count: existing.success_count + (pattern.successRate > 0 ? 1 : 0),
          success_rate: ((existing.success_count + (pattern.successRate > 0 ? 1 : 0)) / (existing.occurrence_count + 1)) * 100,
          last_seen: new Date().toISOString(),
          examples: [...existing.examples, ...pattern.examples].slice(-10) // Keep last 10 examples
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[Supabase] Error updating pattern:', error);
        throw error;
      }
    } else {
      // Insert new pattern
      const { error } = await this.supabase
        .from('error_patterns')
        .insert({
          category: pattern.category,
          languages: pattern.languages,
          frameworks: pattern.frameworks,
          platforms: pattern.platforms,
          error_signatures: pattern.errorSignatures,
          common_causes: pattern.commonCauses,
          prevention_rules: pattern.preventionRules,
          fix_strategies: pattern.fixStrategies,
          occurrence_count: pattern.occurrenceCount,
          success_count: 0,
          success_rate: 0,
          last_seen: new Date().toISOString(),
          examples: pattern.examples
        });

      if (error) {
        console.error('[Supabase] Error inserting pattern:', error);
        throw error;
      }

      await this.incrementPatternCount();
    }
  }

  /**
   * Get all patterns for a specific context
   */
  async getPatterns(context: {
    language?: string;
    framework?: string;
    platform?: string;
  }): Promise<ErrorPattern[]> {
    let query = this.supabase
      .from('error_patterns')
      .select('*')
      .order('occurrence_count', { ascending: false });

    // Filter by context if provided
    if (context.language) {
      query = query.contains('languages', [context.language]);
    }
    if (context.framework) {
      query = query.contains('frameworks', [context.framework]);
    }
    if (context.platform) {
      query = query.contains('platforms', [context.platform]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase] Error fetching patterns:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      category: p.category,
      languages: p.languages,
      frameworks: p.frameworks,
      platforms: p.platforms,
      errorSignatures: p.error_signatures,
      commonCauses: p.common_causes,
      preventionRules: p.prevention_rules,
      fixStrategies: p.fix_strategies,
      occurrenceCount: p.occurrence_count,
      successRate: p.success_rate / 100,
      lastSeen: new Date(p.last_seen),
      examples: p.examples
    }));
  }

  /**
   * Save language-specific rules
   */
  async saveLanguageRules(language: string, rules: string[], sources: string[]): Promise<void> {
    const { data: existing } = await this.supabase
      .from('language_rules')
      .select('*')
      .eq('language', language)
      .single();

    if (existing) {
      // Update existing
      const updatedRules = Array.from(new Set([...existing.rules, ...rules]));
      const updatedSources = Array.from(new Set([...existing.rule_sources, ...sources]));

      await this.supabase
        .from('language_rules')
        .update({
          rules: updatedRules,
          rule_sources: updatedSources,
          last_updated: new Date().toISOString()
        })
        .eq('language', language);
    } else {
      // Insert new
      await this.supabase
        .from('language_rules')
        .insert({
          language,
          rules,
          rule_sources: sources,
          confidence_score: 50,
          last_updated: new Date().toISOString()
        });
    }
  }

  /**
   * Get language-specific rules
   */
  async getLanguageRules(language: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('language_rules')
      .select('rules')
      .eq('language', language)
      .single();

    if (error || !data) {
      return [];
    }

    return data.rules;
  }

  /**
   * Save framework-specific rules
   */
  async saveFrameworkRules(framework: string, language: string, rules: string[], sources: string[]): Promise<void> {
    const { data: existing } = await this.supabase
      .from('framework_rules')
      .select('*')
      .eq('framework', framework)
      .single();

    if (existing) {
      const updatedRules = Array.from(new Set([...existing.rules, ...rules]));
      const updatedSources = Array.from(new Set([...existing.rule_sources, ...sources]));

      await this.supabase
        .from('framework_rules')
        .update({
          rules: updatedRules,
          rule_sources: updatedSources,
          last_updated: new Date().toISOString()
        })
        .eq('framework', framework);
    } else {
      await this.supabase
        .from('framework_rules')
        .insert({
          framework,
          language,
          rules,
          rule_sources: sources,
          confidence_score: 50,
          last_updated: new Date().toISOString()
        });
    }
  }

  /**
   * Get framework-specific rules
   */
  async getFrameworkRules(framework: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('framework_rules')
      .select('rules')
      .eq('framework', framework)
      .single();

    if (error || !data) {
      return [];
    }

    return data.rules;
  }

  /**
   * Save platform-specific rules
   */
  async savePlatformRules(platform: string, rules: string[], sources: string[]): Promise<void> {
    const { data: existing } = await this.supabase
      .from('platform_rules')
      .select('*')
      .eq('platform', platform)
      .single();

    if (existing) {
      const updatedRules = Array.from(new Set([...existing.rules, ...rules]));
      const updatedSources = Array.from(new Set([...existing.rule_sources, ...sources]));

      await this.supabase
        .from('platform_rules')
        .update({
          rules: updatedRules,
          rule_sources: updatedSources,
          last_updated: new Date().toISOString()
        })
        .eq('platform', platform);
    } else {
      await this.supabase
        .from('platform_rules')
        .insert({
          platform,
          rules,
          rule_sources: sources,
          confidence_score: 50,
          last_updated: new Date().toISOString()
        });
    }
  }

  /**
   * Get platform-specific rules
   */
  async getPlatformRules(platform: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('platform_rules')
      .select('rules')
      .eq('platform', platform)
      .single();

    if (error || !data) {
      return [];
    }

    return data.rules;
  }

  /**
   * Load entire knowledge base from database
   */
  async loadKnowledgeBase(): Promise<KnowledgeBase> {
    // Get metadata
    const { data: metadata } = await this.supabase
      .from('knowledge_base_metadata')
      .select('*')
      .single();

    // Get all patterns
    const { data: patternsData } = await this.supabase
      .from('error_patterns')
      .select('*');

    // Get all language rules
    const { data: languageRulesData } = await this.supabase
      .from('language_rules')
      .select('*');

    // Get all framework rules
    const { data: frameworkRulesData } = await this.supabase
      .from('framework_rules')
      .select('*');

    // Get all platform rules
    const { data: platformRulesData } = await this.supabase
      .from('platform_rules')
      .select('*');

    // Transform to KnowledgeBase format
    const patterns: ErrorPattern[] = (patternsData || []).map(p => ({
      id: p.id,
      category: p.category,
      languages: p.languages,
      frameworks: p.frameworks,
      platforms: p.platforms,
      errorSignatures: p.error_signatures,
      commonCauses: p.common_causes,
      preventionRules: p.prevention_rules,
      fixStrategies: p.fix_strategies,
      occurrenceCount: p.occurrence_count,
      successRate: p.success_rate / 100,
      lastSeen: new Date(p.last_seen),
      examples: p.examples
    }));

    const languageSpecificRules: Record<string, string[]> = {};
    (languageRulesData || []).forEach(lr => {
      languageSpecificRules[lr.language] = lr.rules;
    });

    const frameworkSpecificRules: Record<string, string[]> = {};
    (frameworkRulesData || []).forEach(fr => {
      frameworkSpecificRules[fr.framework] = fr.rules;
    });

    const platformSpecificRules: Record<string, string[]> = {};
    (platformRulesData || []).forEach(pr => {
      platformSpecificRules[pr.platform] = pr.rules;
    });

    // Load global best practices
    const { data: bestPracticesData } = await this.supabase
      .from('global_best_practices')
      .select('practice')
      .order('success_rate', { ascending: false })
      .order('usage_count', { ascending: false });

    const globalBestPractices = (bestPracticesData || []).map(bp => bp.practice);

    return {
      version: metadata?.version || '1.0.0',
      lastUpdated: metadata?.last_updated ? new Date(metadata.last_updated) : new Date(),
      patterns,
      languageSpecificRules,
      frameworkSpecificRules,
      platformSpecificRules,
      globalBestPractices
    };
  }

  /**
   * Get statistics from database
   */
  async getStatistics() {
    const { data: metadata } = await this.supabase
      .from('knowledge_base_metadata')
      .select('*')
      .single();

    const { data: patterns } = await this.supabase
      .from('error_patterns')
      .select('category, occurrence_count, success_rate')
      .order('occurrence_count', { ascending: false })
      .limit(5);

    const errorsByCategory: Record<string, number> = {};
    if (patterns) {
      patterns.forEach(p => {
        errorsByCategory[p.category] = p.occurrence_count;
      });
    }

    const resolutionRate = metadata && metadata.total_errors_captured > 0
      ? (metadata.total_errors_resolved / metadata.total_errors_captured) * 100
      : 0;

    return {
      totalErrors: metadata?.total_errors_captured || 0,
      resolvedErrors: metadata?.total_errors_resolved || 0,
      resolutionRate: resolutionRate.toFixed(2) + '%',
      totalPatterns: metadata?.total_patterns || 0,
      errorsByCategory,
      topErrors: (patterns || []).map(p => ({
        category: p.category,
        count: p.occurrence_count,
        successRate: p.success_rate.toFixed(2) + '%'
      })),
      lastUpdated: metadata?.last_updated ? new Date(metadata.last_updated) : new Date()
    };
  }

  /**
   * Helper: Increment total error count
   */
  private async incrementErrorCount(): Promise<void> {
    await this.supabase.rpc('increment_error_count' as any);
    // Fallback if RPC doesn't exist
    const { data: metadata } = await this.supabase
      .from('knowledge_base_metadata')
      .select('*')
      .single();

    if (metadata) {
      await this.supabase
        .from('knowledge_base_metadata')
        .update({
          total_errors_captured: metadata.total_errors_captured + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', metadata.id);
    }
  }

  /**
   * Helper: Increment resolved error count
   */
  private async incrementResolvedCount(): Promise<void> {
    const { data: metadata } = await this.supabase
      .from('knowledge_base_metadata')
      .select('*')
      .single();

    if (metadata) {
      await this.supabase
        .from('knowledge_base_metadata')
        .update({
          total_errors_resolved: metadata.total_errors_resolved + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', metadata.id);
    }
  }

  /**
   * Helper: Increment pattern count
   */
  private async incrementPatternCount(): Promise<void> {
    const { data: metadata } = await this.supabase
      .from('knowledge_base_metadata')
      .select('*')
      .single();

    if (metadata) {
      await this.supabase
        .from('knowledge_base_metadata')
        .update({
          total_patterns: metadata.total_patterns + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', metadata.id);
    }
  }
}

// Singleton instance
let storageInstance: SupabaseLearningStorage | null = null;

export function getSupabaseStorage(): SupabaseLearningStorage {
  if (!storageInstance) {
    storageInstance = new SupabaseLearningStorage();
  }
  return storageInstance;
}
