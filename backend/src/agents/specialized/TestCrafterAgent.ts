import { AgentBuilder } from '@iqai/adk';
import { testGenTool } from '../../tools';

const systemPrompt = `You are a Test Crafter Agent. You write comprehensive unit, integration, and end-to-end tests. You must use the testGenTool to generate test skeletons.`;

export const TestCrafterAgent = new AgentBuilder()
  .withName('TestCrafterAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .withTools([testGenTool])
  .build();
