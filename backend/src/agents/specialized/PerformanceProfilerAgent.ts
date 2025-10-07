import { AgentBuilder } from '@iqai/adk';

const systemPrompt = `You are a Performance Profiler Agent. You analyze code for performance bottlenecks and suggest optimizations.`;

export const PerformanceProfilerAgent = new AgentBuilder()
  .withName('PerformanceProfilerAgent')
  .withModel('gpt-5-nano')
  .withSystemPrompt(systemPrompt)
  .build();
