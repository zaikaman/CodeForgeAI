import { AgentBuilder } from '@iqai/adk';

const systemPrompt = `You are a Security Sentinel Agent. Your purpose is to conduct security analysis and identify vulnerabilities in code, dependencies, and infrastructure.`;

export const SecuritySentinelAgent = new AgentBuilder()
  .withName('SecuritySentinelAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .build();
