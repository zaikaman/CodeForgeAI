/**
 * CodeGeneratorAgent - AI-powered code generation using local ADK
 * Uses language-specific prompt templates for better code generation
 * Now includes DYNAMIC learned rules from ErrorLearningSystem
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt, detectLanguage } from '../../prompts/language-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../../services/validation/PreValidationRules';
import { getLearningIntegration } from '../../services/learning/LearningIntegrationService';

interface CodeGeneratorOptions {
  language?: string;
  framework?: string;
  platform?: string;
  requirements?: string;
}

export const CodeGeneratorAgent = async (options?: CodeGeneratorOptions) => {
  // Detect language from requirements if not explicitly provided
  let targetLanguage = options?.language;
  
  if (!targetLanguage && options?.requirements) {
    targetLanguage = detectLanguage(options.requirements) || undefined;
  }
  
  // Get the appropriate language-specific prompt
  let systemPrompt = targetLanguage 
    ? getLanguagePrompt(targetLanguage)
    : getLanguagePrompt('default');
  
  // Add static validation rules (fallback for common issues)
  const staticValidationRules = generateValidationPrompt(targetLanguage || 'typescript');
  const checklist = getAIChecklistPrompt();
  
  // Get DYNAMIC learned rules from ErrorLearningSystem
  let learnedRules = '';
  try {
    const learningService = getLearningIntegration();
    learnedRules = await learningService.getSmartPromptAddition({
      language: targetLanguage || 'typescript',
      framework: options?.framework,
      platform: options?.platform || 'fly.io',
      prompt: options?.requirements || ''
    });
  } catch (error) {
    console.warn('[CodeGeneratorAgent] Failed to fetch learned rules:', error);
  }
  
  // Combine: base prompt + static rules + learned rules + checklist
  systemPrompt = systemPrompt + 
                 '\n\n' + staticValidationRules + 
                 (learnedRules ? '\n\n' + learnedRules : '') + 
                 '\n\n' + checklist;
  
  console.log(`[CodeGeneratorAgent] Using prompt for language: ${targetLanguage || 'default'}`);
  console.log(`  - Static rules: ✓`);
  console.log(`  - Learned rules: ${learnedRules ? '✓' : '✗'}`);
  console.log(`  - Checklist: ✓`);
  
  return AgentBuilder.create('CodeGeneratorAgent')
    .withModel('gpt-5-nano')
    .withInstruction(systemPrompt)
    .withOutputSchema(generationSchema)
    .build();
};
