/**
 * SimpleCoderAgent - Fast code generation for HTML/Vanilla JS
 * Optimized for speed - lightweight prompt, minimal overhead
 * ULTRA-FAST: Designed for simple web apps and HTML projects
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { SIMPLE_CODER_PROMPT } from '../../prompts/simple-coder-prompt';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import { createImageGenerationTool } from '../../tools/generation/imageGenerationTool';
import type { GitHubToolsContext } from '../../utils/githubTools';

interface SimpleCoderOptions {
  language?: string;
  requirements?: string;
  githubContext?: GitHubToolsContext | null;
  userId?: string;
}

export const SimpleCoderAgent = async (options?: SimpleCoderOptions) => {
  const startTime = Date.now();
  
  console.log('[SimpleCoderAgent] Fast mode - using lightweight prompt');
  
  // Use the ultra-lightweight prompt (no cache needed - it's already minimal)
  const systemPrompt = SIMPLE_CODER_PROMPT;
  
  // Escape curly braces
  const escapedPrompt = systemPrompt.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Enhance with GitHub tools if available
  const finalPrompt = enhancePromptWithGitHub(escapedPrompt, options?.githubContext || null);
  
  const promptTime = Date.now() - startTime;
  console.log(`[SimpleCoderAgent] Prompt loaded: ${promptTime}ms (${finalPrompt.length} chars)`);
  
  let builder = AgentBuilder.create('SimpleCoderAgent')
    .withModel('gpt-5-mini-2025-08-07')
    .withInstruction(finalPrompt)
    .withOutputSchema(generationSchema);
  
  // Add image generation tool if userId is available
  if (options?.userId) {
    const imageGenTool = createImageGenerationTool(options.userId);
    builder = builder.withTools(imageGenTool);
    console.log('[SimpleCoderAgent] Image generation tool enabled');
  }
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'SimpleCoderAgent'
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`[SimpleCoderAgent] Total init: ${totalTime}ms`);
  
  return builder.build();
};
