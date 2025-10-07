import { AgentBuilder } from '@iqai/adk';

const systemPrompt = `You are a Spec Interpreter Agent. Your role is to parse natural language specifications and extract clear, actionable requirements. You will be given a user's request and must identify the core features, constraints, and goals.`;

export const SpecInterpreterAgent = new AgentBuilder()
  .withName('SpecInterpreterAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .build();
