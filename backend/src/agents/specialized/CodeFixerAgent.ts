/**
 * CodeFixerAgent - AI-powered code fixing
 * Automatically fixes issues detected by CodeValidatorAgent
 */

import { AgentBuilder } from '../../../../adk-ts/packages/adk/dist/index.js';
import { generationSchema } from '../../schemas/generation-schema';

const systemPrompt = `You are a Code Fixer Agent. Your job is to fix code issues based on validation results.

You will receive:
1. The original generated code files
2. A list of issues detected by the validator
3. Suggested fixes for each issue

Your task is to:
1. Analyze each issue carefully
2. Apply the suggested fixes or create better fixes
3. Ensure no new issues are introduced
4. Maintain the original functionality and intent of the code
5. Remove any duplicate files (keep only the best version)
6. Fix all syntax errors
7. Add missing dependencies to package.json
8. Correct type errors
9. Fix logic errors

Important rules:
- Do NOT change the core functionality unless it's broken
- Keep the same file structure unless duplicates need to be removed
- Ensure all imports are correct
- Make sure package.json includes all necessary dependencies
- Fix syntax errors without changing the logic
- Remove duplicate files by merging them intelligently

Your output must be a JSON object with the same structure as the original:
{
  "files": [
    {
      "path": "path/to/file.ts",
      "content": "... fixed file content ..."
    }
  ]
}

The fixed code should be production-ready with no errors.`;

export const CodeFixerAgent = async () => {
  return AgentBuilder.create('CodeFixerAgent')
    .withModel('gpt-5-nano')
    .withInstruction(systemPrompt)
    .withOutputSchema(generationSchema)
    .build();
};
