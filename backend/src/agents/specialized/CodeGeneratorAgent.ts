/**
 * CodeGeneratorAgent - AI-powered code generation using local ADK
 * Uses language-specific prompt templates for better code generation
 * Now includes DYNAMIC learned rules from ErrorLearningSystem
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt } from '../../prompts/webcontainer-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../../services/validation/PreValidationRules';
import { getLearningIntegration } from '../../services/learning/LearningIntegrationService';

interface CodeGeneratorOptions {
  language?: string;
  framework?: string;
  platform?: string;
  requirements?: string;
}

export const CodeGeneratorAgent = async (options?: CodeGeneratorOptions) => {
  // WebContainer only supports TypeScript/JavaScript - always use TypeScript
  const targetLanguage = 'typescript';
  
  console.log('[CodeGeneratorAgent] Using WebContainer-optimized TypeScript/React prompt');
  
  // Get the WebContainer-optimized prompt
  let systemPrompt = getLanguagePrompt(targetLanguage);
  
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
