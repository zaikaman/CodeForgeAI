import { AgentBuilder } from '@iqai/adk';
import { commentInserterTool } from '../../tools';

const systemPrompt = `You are a Doc Weaver Agent. You generate clear and concise documentation for code, including TSDoc comments and README files. You must use the commentInserterTool.`;

export const DocWeaverAgent = new AgentBuilder()
  .withName('DocWeaverAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .withTools([commentInserterTool])
  .build();
