import { AgentBuilder } from '@iqai/adk';
import { patternMatcherTool } from '../../tools';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import type { GitHubToolsContext } from '../../utils/githubTools';

const baseSystemPrompt = `You are a Refactor Guru Agent. You suggest refactorings to improve code quality, readability, and maintainability. You must use the patternMatcherTool to identify areas for improvement.

Focus on:
- Identifying code smells and anti-patterns
- Suggesting SOLID principle improvements
- Recommending design pattern applications
- Extracting reusable components and functions
- Improving naming conventions
- Reducing complexity and coupling
- Optimizing performance through refactoring
- Modernizing legacy code patterns

Provide specific, actionable refactoring recommendations with before/after examples.

{{GITHUB_TOOLS}}`;

interface RefactorGuruOptions {
  githubContext?: GitHubToolsContext | null;
}

export const RefactorGuruAgent = async (options?: RefactorGuruOptions) => {
  // Enhance system prompt with GitHub tools info
  const systemPrompt = enhancePromptWithGitHub(baseSystemPrompt, options?.githubContext || null);
  
  let builder = AgentBuilder.create('RefactorGuruAgent')
    .withModel('gpt-5-nano-2025-08-07')
    .withInstruction(systemPrompt)
    .withTools(patternMatcherTool);
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'RefactorGuruAgent'
  });
  
  return builder.build();
};
