/**
 * Agent Initialization Service
 * Preloads and warms up caches for faster agent creation
 */

import { getPromptCache } from '../utils/PromptCache';
import { getLanguagePrompt } from '../prompts/webcontainer-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../services/validation/PreValidationRules';
import { getLearningIntegration } from '../services/learning/LearningIntegrationService';

/**
 * Preload common prompts and warm up caches
 */
export async function preloadAgentCaches(): Promise<void> {
  console.log('[AgentInit] Preloading agent caches...');
  const startTime = Date.now();

  const promptCache = getPromptCache();
  const learningService = getLearningIntegration();

  try {
    // Preload language prompts (most common: TypeScript)
    await promptCache.preload([
      {
        key: 'language:typescript',
        loader: () => getLanguagePrompt('typescript')
      },
      {
        key: 'validation:typescript',
        loader: () => generateValidationPrompt('typescript')
      },
      {
        key: 'checklist:ai',
        loader: () => getAIChecklistPrompt()
      }
    ]);

    // Warm up learning rules cache for common configurations
    const commonConfigs = [
      { language: 'typescript', framework: 'react', platform: 'webcontainer' },
      { language: 'typescript', framework: undefined, platform: 'webcontainer' },
      { language: 'javascript', framework: 'react', platform: 'webcontainer' }
    ];

    for (const config of commonConfigs) {
      try {
        await learningService.getSmartPromptAddition({
          ...config,
          prompt: '' // Empty prompt for preload
        });
      } catch (error) {
        console.warn(`[AgentInit] Failed to preload rules for ${config.language}:`, error);
      }
    }

    const elapsed = Date.now() - startTime;
    const stats = promptCache.getStats();
    
    console.log(`[AgentInit] ✓ Preloaded ${stats.entries} prompts (${stats.totalSizeKB} KB) in ${elapsed}ms`);
    console.log(`[AgentInit] ✓ Cache ready for fast agent initialization`);

  } catch (error) {
    console.error('[AgentInit] Failed to preload caches:', error);
    // Don't throw - app should still work without preloading
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getAgentCacheStats() {
  const promptCache = getPromptCache();
  return {
    promptCache: promptCache.getStats(),
    timestamp: new Date()
  };
}
