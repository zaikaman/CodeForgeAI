import { AgentBuilder } from '@iqai/adk';
import { codeParseTool } from '../../tools';

const systemPrompt = `You are a Code Generator Agent. You write high-quality, production-ready code based on provided requirements. You must use the codeParseTool to analyze existing code and ensure your generated code integrates correctly.`;

export const CodeGeneratorAgent = new AgentBuilder()
  .withName('CodeGeneratorAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .withTools([codeParseTool])
  .build();
