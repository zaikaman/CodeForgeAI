/**
 * CodeModificationAgent - AI-powered code modification and bug fixing
 * Specialized agent for modifying existing codebases, fixing bugs, and improving code quality
 * 
 * This agent is BETTER than ChatAgent for code changes because:
 * 1. Has language-specific prompts and validation rules
 * 2. Uses specialized output schema for code generation
 * 3. Has pre-validation rules to prevent common errors
 * 4. Supports GitHub integration for repository operations
 * 
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

interface CodeModificationOptions {
  language?: string;
  framework?: string;
  platform?: string;
  currentCode?: string;
  errorContext?: string;
  githubContext?: GitHubToolsContext | null;
}

/**
 * Core system prompt for code modification
 */
const CODE_MODIFICATION_BASE_PROMPT = `
# CODE MODIFICATION AGENT

You are a specialized AI agent for **modifying, fixing, and improving existing codebases**.

## YOUR ROLE:
- Fix bugs in existing code
- Add new features to existing projects
- Refactor and improve code quality
- Fix deployment and runtime errors
- Optimize performance
- Improve styling and UI/UX
- Add missing functionality
- Debug and resolve issues

## CORE PRINCIPLES:

### 1. COMPLETE FILE RETURN POLICY 🚨🚨🚨
**ABSOLUTE CRITICAL REQUIREMENT: RETURN EVERY SINGLE FILE YOU RECEIVE**

This is NOT optional. This is MANDATORY:
- If you receive 10 files, return EXACTLY 10 files
- If you receive 24 files, return EXACTLY 24 files
- Include EVERY file: modified files AND unchanged files
- Never omit files - even if you didn't modify them
- The system will REJECT your response if file count doesn't match
- Omitting files causes complete build failures

⚠️ VALIDATION: Before submitting your response, COUNT the files in your output.
The count MUST match the input file count. NO EXCEPTIONS.

### 2. MINIMAL CHANGES PHILOSOPHY
- Only change what's necessary to fulfill the request
- Keep existing code structure and patterns
- Maintain code style and conventions
- Don't refactor unrelated code unless asked

### 3. ERROR CONTEXT AWARENESS
If error logs are provided:
- Carefully analyze error messages and stack traces
- Identify root cause before making changes
- Fix the actual problem, not just symptoms
- Test-driven fixes: ensure error won't happen again

### 4. DEPLOYMENT ERROR FIXES 🔥
When fixing deployment/build errors:
- Check for missing dependencies in package.json
- Verify import statements are correct
- Ensure all referenced files exist
- Fix syntax and type errors
- Validate configuration files

## COMMON ERROR PATTERNS AND FIXES:

### Missing Dependencies
❌ Error: "Cannot find module 'package-name'"
✅ Fix: Add to package.json dependencies with proper version
Example: "swr": "^2.2.5"

### Import/Export Issues
❌ Error: "module.exports in ES module"
✅ Fix: Use "export default" instead of module.exports
Or: Add "type": "module" to package.json

### React Hook Issues
❌ Error: "Invalid hook call"
✅ Fix: 
  - Import hooks at top: import { use...State } from 'react'
  - Call hooks at top level of component
  - Never call hooks in loops/conditions

### Routing Hook Issues
❌ Error: "Property does not exist on routing object"
✅ Fix: Import routing hook directly from package
Example: import { use...Router } from 'next/router'
Then: const router = useRouter()
NOT: router.useRouter() ❌

### Template String Issues
❌ Error: "Unterminated string literal"
✅ Fix: Avoid nested backticks in template strings
Use String.raw for XML/HTML generation
Or use proper escaping

### TypeScript Issues
❌ Error: "JSX element implicitly has type 'any'"
✅ Fix:
  - Add "jsx": "react-jsx" to tsconfig.json
  - Include @types/* packages in devDependencies
  - Add proper type annotations

### Missing Files
❌ Error: "Could not resolve './component.tsx'"
✅ Fix: CREATE the missing file and include it in response

## OUTPUT FORMAT:

Return JSON with ALL files:
{
  "files": [
    {
      "path": "package.json",
      "content": "... complete file content ..."
    },
    {
      "path": "src/App.tsx",
      "content": "... complete file content ..."
    },
    ... ALL other files ...
  ]
}

## QUALITY CHECKLIST:
Before returning code, verify:
✅ All files are included (modified + unchanged)
✅ All imports have corresponding dependencies
✅ No syntax errors
✅ No type errors
✅ Proper error handling
✅ Code follows project conventions
✅ Changes address the root cause
✅ No new issues introduced
`;

export const CodeModificationAgent = async (options?: CodeModificationOptions) => {
  // Detect language from files or default to 'html' for simplicity
  let targetLanguage = options?.language;
  
  // If language not provided and we have current code/files, try to detect
  if (!targetLanguage && options?.currentCode) {
    // Import detectLanguageFromFiles to detect from file structure
    const { detectLanguageFromFiles } = await import('../../services/preview/DockerfileTemplates');
    
    // Try to parse currentCode as file array
    try {
      const parsedFiles = typeof options.currentCode === 'string' 
        ? JSON.parse(options.currentCode) 
        : options.currentCode;
      
      if (Array.isArray(parsedFiles) && parsedFiles.length > 0 && parsedFiles[0].path) {
        targetLanguage = detectLanguageFromFiles(parsedFiles);
        console.log('[CodeModificationAgent] Detected language from files:', targetLanguage);
      }
    } catch (e) {
      // Not JSON or not file array, use default
    }
  }
  
  // Fallback to 'html' for simplicity (vanilla HTML/CSS/JS)
  targetLanguage = targetLanguage || 'html';
  
  console.log('[CodeModificationAgent] Initializing for language:', targetLanguage);
  
  const promptCache = getPromptCache();
  
  // Get language-specific base prompt (cached)
  let languagePrompt = promptCache.getOrLoad(
    `language:${targetLanguage}`,
    () => getLanguagePrompt(targetLanguage)
  );
  
  // CRITICAL: Escape curly braces in language prompt to prevent ADK template conflicts
  languagePrompt = languagePrompt.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Enhance with GitHub tools description if available
  languagePrompt = enhancePromptWithGitHub(languagePrompt, options?.githubContext || null);
  
  // Get validation rules (cached)
  let staticValidationRules = promptCache.getOrLoad(
    `validation:${targetLanguage}`,
    () => generateValidationPrompt(targetLanguage)
  );
  
  // CRITICAL: Escape curly braces in validation rules
  staticValidationRules = staticValidationRules.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  let checklist = promptCache.getOrLoad(
    'checklist:ai',
    () => getAIChecklistPrompt()
  );
  
  // CRITICAL: Escape curly braces in checklist
  checklist = checklist.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // CRITICAL: Escape base prompt as well
  const escapedBasePrompt = CODE_MODIFICATION_BASE_PROMPT.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  
  // Combine all prompts:
  // Base modification prompt + Language prompt + Static rules + Checklist
  let combinedPrompt = escapedBasePrompt +
                       '\n\n' + languagePrompt +
                       '\n\n' + staticValidationRules + 
                       '\n\n' + checklist;
  
  // Add error context if provided
  if (options?.errorContext) {
    // Also escape error context in case it contains curly braces
    const escapedErrorContext = options.errorContext.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
    combinedPrompt += `\n\n## ERROR CONTEXT TO FIX:\n${escapedErrorContext}\n`;
  }
  
  // Compress the final prompt (all curly braces already escaped above)
  const compressedPrompt = smartCompress(combinedPrompt);
  
  // Log compression stats
  const stats = getCompressionStats(combinedPrompt, compressedPrompt);
  console.log(`[CodeModificationAgent] Configuration:`);
  console.log(`  - Language: ${targetLanguage}`);
  console.log(`  - Framework: ${options?.framework || 'default'}`);
  console.log(`  - Static rules: ✓`);
  console.log(`  - Error context: ${options?.errorContext ? '✓' : '✗'}`);
  console.log(`  - Checklist: ✓`);
  console.log(`  - Compressed: ${stats.originalSize} → ${stats.compressedSize} bytes (saved ${stats.savedPercent}%)`);
  
  let builder = AgentBuilder.create('CodeModificationAgent')
    .withModel('gpt-5-mini')
    .withInstruction(compressedPrompt)
    .withOutputSchema(generationSchema);
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'CodeModificationAgent'
  });
  
  return builder.build();
};
