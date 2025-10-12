/**
 * CodeGeneratorAgent - AI-powered code generation using local ADK
 * Uses language-specific prompt templates for better code generation
 * Now includes DYNAMIC learned rules from ErrorLearningSystem
 * OPTIMIZED with prompt caching and lazy loading
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt } from '../../prompts/webcontainer-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../../services/validation/PreValidationRules';
import { getLearningIntegration } from '../../services/learning/LearningIntegrationService';
import { getPromptCache } from '../../utils/PromptCache';
import { smartCompress, getCompressionStats } from '../../utils/PromptCompression';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import type { GitHubToolsContext } from '../../utils/githubTools';

interface CodeGeneratorOptions {
  language?: string;
  framework?: string;
  platform?: string;
  requirements?: string;
  githubContext?: GitHubToolsContext | null;
}

export const CodeGeneratorAgent = async (options?: CodeGeneratorOptions) => {
  // WebContainer only supports TypeScript/JavaScript - always use TypeScript
  const targetLanguage = 'typescript';
  
  console.log('[CodeGeneratorAgent] Using WebContainer-optimized TypeScript/React prompt');
  
  const promptCache = getPromptCache();
  
  // Use lazy-loaded cached prompts
  let systemPrompt = promptCache.getOrLoad(
    `language:${targetLanguage}`,
    () => getLanguagePrompt(targetLanguage)
  );
  
  // Enhance with GitHub tools description if available
  systemPrompt = enhancePromptWithGitHub(systemPrompt, options?.githubContext || null);
  
  // Add static validation rules (cached)
  const staticValidationRules = promptCache.getOrLoad(
    `validation:${targetLanguage}`,
    () => generateValidationPrompt(targetLanguage || 'typescript')
  );
  const checklist = promptCache.getOrLoad(
    'checklist:ai',
    () => getAIChecklistPrompt()
  );
  
  // Get DYNAMIC learned rules from ErrorLearningSystem
  let learnedRules = '';
  try {
    const learningService = getLearningIntegration();
    learnedRules = await learningService.getSmartPromptAddition({
      language: targetLanguage || 'typescript',
      framework: options?.framework,
      platform: options?.platform || 'webcontainer', // Default to WebContainer, but can deploy to fly.io optionally
      prompt: options?.requirements || ''
    });
    
    // Sanitize learned rules to remove potential template variables that could conflict with ADK
    // Replace {variable} patterns with VARIABLE_NAME to avoid ADK template processing
    const originalLength = learnedRules.length;
    learnedRules = learnedRules.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, 'VARIABLE_$1');
    
    if (learnedRules.length !== originalLength) {
      console.log('[CodeGeneratorAgent] Sanitized learned rules to prevent template conflicts');
    }
    
  } catch (error) {
    console.warn('[CodeGeneratorAgent] Failed to fetch learned rules:', error);
  }
  
  // Combine: base prompt + static rules + learned rules + checklist
  // Note: learnedRules already sanitized above to prevent template variable conflicts
  let combinedPrompt = systemPrompt + 
                       '\n\n' + staticValidationRules + 
                       (learnedRules ? '\n\n' + learnedRules : '') + 
                       '\n\n' + checklist;
  
  // Compress the final prompt to reduce size
  const compressedPrompt = smartCompress(combinedPrompt);
  
  // Log compression stats
  const stats = getCompressionStats(combinedPrompt, compressedPrompt);
  console.log(`[CodeGeneratorAgent] Using prompt for language: ${targetLanguage || 'default'}`);
  console.log(`  - Static rules: ✓`);
  console.log(`  - Learned rules: ${learnedRules ? '✓' : '✗'}`);
  console.log(`  - Checklist: ✓`);
  console.log(`  - Compressed: ${stats.originalSize} → ${stats.compressedSize} bytes (saved ${stats.savedPercent}%)`);
  
  let builder = AgentBuilder.create('CodeGeneratorAgent')
    .withModel('gpt-5-nano')
    .withInstruction(compressedPrompt)
    .withOutputSchema(generationSchema);
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'CodeGeneratorAgent'
  });
  
  return builder.build();
};
