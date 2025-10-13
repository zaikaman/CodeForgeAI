/**
 * WebContainer-optimized prompt template for TypeScript/JavaScript projects
 * Based on bolt.diy's proven prompt engineering
 */

import BOLT_INSPIRED_PROMPT from './bolt-inspired';

export const WEBCONTAINER_TYPESCRIPT_TEMPLATE = BOLT_INSPIRED_PROMPT;

export const detectLanguage = (prompt: string): string | null => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Always return TypeScript/JavaScript for WebContainer
  if (
    lowerPrompt.includes('react') ||
    lowerPrompt.includes('typescript') ||
    lowerPrompt.includes('javascript') ||
    lowerPrompt.includes('web app') ||
    lowerPrompt.includes('website') ||
    lowerPrompt.includes('frontend')
  ) {
    return 'typescript';
  }
  
  // Default to TypeScript
  return 'typescript';
};

export const getLanguagePrompt = (language: string): string => {
  // Only support TypeScript/JavaScript for WebContainer
  if (language === 'typescript' || language === 'javascript' || language === 'default') {
    return WEBCONTAINER_TYPESCRIPT_TEMPLATE;
  }
  
  // Fallback to TypeScript
  return WEBCONTAINER_TYPESCRIPT_TEMPLATE;
};
