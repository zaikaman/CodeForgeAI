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
  // Detect language from requirements - prioritize simplicity
  const { detectLanguage } = await import('../../prompts/webcontainer-templates');
  const detectedLanguage = options?.requirements 
    ? detectLanguage(options.requirements) 
    : null;
  
  // Use detected language or fallback to typescript
  const targetLanguage = detectedLanguage || options?.language || 'typescript';
  
  console.log('[CodeGeneratorAgent] Detected language:', targetLanguage);
  console.log('[CodeGeneratorAgent] Requirements:', options?.requirements?.substring(0, 100));
  
  const promptCache = getPromptCache();
  
  // Use lazy-loaded cached prompts
  let systemPrompt = promptCache.getOrLoad(
    `language:${targetLanguage}`,
    () => getLanguagePrompt(targetLanguage)
  );
  
  // CRITICAL: Escape curly braces to prevent ADK template conflicts
  systemPrompt = systemPrompt.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Enhance with GitHub tools description if available
  systemPrompt = enhancePromptWithGitHub(systemPrompt, options?.githubContext || null);
  
  // Add static validation rules (cached) - skip for vanilla HTML
  let staticValidationRules = promptCache.getOrLoad(
    `validation:${targetLanguage}`,
    () => generateValidationPrompt(targetLanguage || 'typescript')
  );
  staticValidationRules = staticValidationRules.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Add checklist (cached) - simplified for vanilla HTML
  let checklist = promptCache.getOrLoad(
    `checklist:${targetLanguage}`,
    () => getAIChecklistPrompt(targetLanguage || 'typescript')
  );
  checklist = checklist.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Get DYNAMIC learned rules from ErrorLearningSystem
  let learnedRules = '';
  try {
    const learningService = getLearningIntegration();
    const rawLearnedRules = await learningService.getSmartPromptAddition({
      language: targetLanguage || 'typescript',
      framework: options?.framework,
      platform: options?.platform || 'webcontainer', // Default to WebContainer, but can deploy to fly.io optionally
      prompt: options?.requirements || ''
    });
    
    // CRITICAL: Sanitize learned rules IMMEDIATELY to prevent ADK template variable conflicts
    // ADK treats {variable} as context variables, so we must escape them with double braces
    learnedRules = rawLearnedRules.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
    
    if (rawLearnedRules !== learnedRules) {
      console.log('[CodeGeneratorAgent] Escaped curly braces in learned rules to prevent ADK template conflicts');
    }
    
  } catch (error) {
    console.warn('[CodeGeneratorAgent] Failed to fetch learned rules:', error);
  }
  
  // Combine: base prompt + static rules + learned rules + checklist
  // Note: All components already have curly braces escaped above
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
