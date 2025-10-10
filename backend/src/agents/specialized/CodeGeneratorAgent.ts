/**
 * CodeGeneratorAgent - AI-powered code generation using local ADK
 * Uses language-specific prompt templates for better code generation
 */

import { AgentBuilder } from '../../../../adk-ts/packages/adk/dist/index';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt, detectLanguage } from '../../prompts/language-templates';

interface CodeGeneratorOptions {
  language?: string;
  requirements?: string;
}

export const CodeGeneratorAgent = async (options?: CodeGeneratorOptions) => {
  // Detect language from requirements if not explicitly provided
  let targetLanguage = options?.language;
  
  if (!targetLanguage && options?.requirements) {
    targetLanguage = detectLanguage(options.requirements) || undefined;
  }
  
  // Get the appropriate language-specific prompt
  const systemPrompt = targetLanguage 
    ? getLanguagePrompt(targetLanguage)
    : getLanguagePrompt('default');
  
  console.log(`[CodeGeneratorAgent] Using prompt for language: ${targetLanguage || 'default'}`);
  
  return AgentBuilder.create('CodeGeneratorAgent')
    .withModel('gpt-5-nano')
    .withInstruction(systemPrompt)
    .withOutputSchema(generationSchema)
    .build();
};
