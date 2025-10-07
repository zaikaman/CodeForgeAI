import { AgentBuilder } from '@iqai/adk';

const systemPrompt = `You are a Bug Hunter Agent. Your mission is to find bugs and security vulnerabilities in code. You will be given a piece of code and must analyze it for potential issues.`;

export const BugHunterAgent = new AgentBuilder()
  .withName('BugHunterAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .build();
