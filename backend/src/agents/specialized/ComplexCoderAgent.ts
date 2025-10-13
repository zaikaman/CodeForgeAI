/**
 * ComplexCoderAgent - Advanced code generation for TypeScript/Frameworks
 * Full validation, compression, and best practices for complex projects
 * OPTIMIZED with prompt caching and parallel loading
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt } from '../../prompts/webcontainer-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../../services/validation/PreValidationRules';
import { getPromptCache } from '../../utils/PromptCache';
import { smartCompress, getCompressionStats } from '../../utils/PromptCompression';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import type { GitHubToolsContext } from '../../utils/githubTools';

interface ComplexCoderOptions {
  language?: string;
  framework?: string;
  platform?: string;
  requirements?: string;
  githubContext?: GitHubToolsContext | null;
}

export const ComplexCoderAgent = async (options?: ComplexCoderOptions) => {
  const startTime = Date.now();
  
  // Complex languages: typescript, javascript, react, vue, etc.
  const targetLanguage = options?.language || 'typescript';
  
  console.log('[ComplexCoderAgent] Advanced mode for:', targetLanguage);
  console.log('[ComplexCoderAgent] Requirements:', options?.requirements?.substring(0, 100));
  
  const promptCache = getPromptCache();
  
  // Load all prompts in parallel
  const [systemPrompt, staticValidationRules, checklist] = await Promise.all([
    promptCache.getOrLoad(
      `complex:${targetLanguage}`,
      () => getLanguagePrompt(targetLanguage)
    ),
    promptCache.getOrLoad(
      `validation:${targetLanguage}`,
      () => generateValidationPrompt(targetLanguage)
    ),
    promptCache.getOrLoad(
      `checklist:${targetLanguage}`,
      () => getAIChecklistPrompt(targetLanguage)
    )
  ]);
  
  // Escape curly braces
  const escapedSystemPrompt = systemPrompt.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  const escapedValidationRules = staticValidationRules.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  const escapedChecklist = checklist.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Enhance with GitHub tools
  const enhancedPrompt = enhancePromptWithGitHub(escapedSystemPrompt, options?.githubContext || null);
  
  // Apply smart compression
  const combinedPrompt = enhancedPrompt + 
                         '\n\n' + escapedValidationRules + 
                         '\n\n' + escapedChecklist;
  
  const finalPrompt = smartCompress(combinedPrompt);
  
  // Log compression stats
  const stats = getCompressionStats(combinedPrompt, finalPrompt);
  console.log(`[ComplexCoderAgent] Compressed: ${stats.originalSize} → ${stats.compressedSize} bytes (saved ${stats.savedPercent}%)`);
  
  const promptTime = Date.now() - startTime;
  console.log(`[ComplexCoderAgent] Prompt preparation: ${promptTime}ms`);
  console.log(`  - Language: ${targetLanguage}`);
  console.log(`  - Validation: ✓`);
  console.log(`  - Checklist: ✓`);
  
  let builder = AgentBuilder.create('ComplexCoderAgent')
    .withModel('gpt-5-nano')
    .withInstruction(finalPrompt)
    .withOutputSchema(generationSchema);
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'ComplexCoderAgent'
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`[ComplexCoderAgent] Total initialization: ${totalTime}ms`);
  
  return builder.build();
};
