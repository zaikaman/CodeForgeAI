import { AgentBuilder } from '@iqai/adk';
import { patternMatcherTool } from '../../tools';

const systemPrompt = `You are a Refactor Guru Agent. You suggest refactorings to improve code quality, readability, and maintainability. You must use the patternMatcherTool to identify areas for improvement.`;

export const RefactorGuruAgent = new AgentBuilder()
  .withName('RefactorGuruAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .withTools([patternMatcherTool])
  .build();
