/**
 * SimpleCoderAgent - Fast code generation for HTML/Vanilla JS
 * Optimized for speed - no compression, minimal validation
 * ULTRA-FAST: Designed for simple web apps and HTML projects
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt } from '../../prompts/webcontainer-templates';
import { getPromptCache } from '../../utils/PromptCache';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import type { GitHubToolsContext } from '../../utils/githubTools';

interface SimpleCoderOptions {
  language?: string;
  requirements?: string;
  githubContext?: GitHubToolsContext | null;
}

export const SimpleCoderAgent = async (options?: SimpleCoderOptions) => {
  const startTime = Date.now();
  
  // Simple languages only: html, vanilla, css
  const targetLanguage = options?.language || 'html';
  
  console.log('[SimpleCoderAgent] Fast mode for:', targetLanguage);
  
  const promptCache = getPromptCache();
  
  // Load only the base language prompt (no validation, no checklist)
  const systemPrompt = await promptCache.getOrLoad(
    `simple:${targetLanguage}`,
    () => getLanguagePrompt(targetLanguage)
  );
  
  // Escape curly braces
  const escapedPrompt = systemPrompt.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Enhance with GitHub tools if available
  const finalPrompt = enhancePromptWithGitHub(escapedPrompt, options?.githubContext || null);
  
  const promptTime = Date.now() - startTime;
  console.log(`[SimpleCoderAgent] Ultra-fast init: ${promptTime}ms (no compression)`);
  
  let builder = AgentBuilder.create('SimpleCoderAgent')
    .withModel('gpt-5-nano')
    .withInstruction(finalPrompt)
    .withOutputSchema(generationSchema);
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'SimpleCoderAgent'
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`[SimpleCoderAgent] Total: ${totalTime}ms`);
  
  return builder.build();
};
