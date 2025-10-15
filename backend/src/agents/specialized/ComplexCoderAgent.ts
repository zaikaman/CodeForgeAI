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
  
  // Add TypeScript-only restriction for ComplexCoderAgent
  const typeScriptOnlyRule = `

<complex_coder_restrictions>
  CRITICAL: ComplexCoderAgent can ONLY generate TypeScript-based applications.
  
  ❌ FORBIDDEN:
  - Simple HTML/CSS/JS applications (index.html + styles.css + script.js)
  - Vanilla JavaScript without build tools
  - Static websites without frameworks
  - Single-page HTML files with inline scripts
  
  ✅ REQUIRED:
  - Must use TypeScript (React, Vue, or other TypeScript frameworks)
  - Must have proper build configuration (Vite, package.json)
  - Must include TypeScript types and interfaces
  - Must use modern framework patterns (components, hooks, state management)
  
  If the user requests a simple HTML app, you must:
  1. Respond with an error message explaining this agent only handles TypeScript projects
  2. Suggest they use the SimpleCoder agent instead for HTML/CSS/JS apps
  3. Do NOT attempt to generate the simple HTML app
  
  Example rejection response:
  {{
    "error": "ComplexCoderAgent can only generate TypeScript applications. For simple HTML/CSS/JS apps, please use the SimpleCoder agent instead. This agent is designed for complex projects using React, Vue, or other TypeScript frameworks."
  }}
</complex_coder_restrictions>
`;
  
  // Apply smart compression
  const combinedPrompt = enhancedPrompt + 
                         '\n\n' + escapedValidationRules + 
                         '\n\n' + escapedChecklist +
                         '\n\n' + typeScriptOnlyRule;
  
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
    .withModel('gpt-5-nano-2025-08-07')
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
