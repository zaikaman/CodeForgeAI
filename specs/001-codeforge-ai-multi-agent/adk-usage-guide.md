# ADK-TS Usage Guide for CodeForge AI

**Purpose**: Quick reference for using local ADK-TS with OpenAI models

---

## Key Understanding

✅ **ADK-TS includes OpenAI SDK internally** - No separate `openai` package installation needed  
✅ **Just specify model name** - ADK-TS handles all LLM provider connections  
✅ **Environment variables** - Set `OPENAI_API_KEY` and ADK-TS reads it automatically

---

## Basic Agent Creation

```typescript
import { AgentBuilder } from '@iqai/adk';

// Simple agent with glm-4.6
const agent = await AgentBuilder
  .withModel('glm-4.6')
  .withSystemPrompt('You are a code generation expert.')
  .withTemperature(0.2)
  .withMaxTokens(4096)
  .build();

// Ask a question
const { runner } = agent;
const response = await runner.run('Generate a TypeScript function...');
```

---

## Agent with Tools

```typescript
import { AgentBuilder, createTool } from '@iqai/adk';
import { z } from 'zod';

// Define a custom tool
const parseCodeTool = createTool({
  name: 'parseCode',
  description: 'Parse TypeScript code into AST',
  parameters: z.object({
    code: z.string().describe('TypeScript code to parse'),
  }),
  execute: async ({ code }) => {
    // Use ts-morph here
    const project = new Project();
    const sourceFile = project.createSourceFile('temp.ts', code);
    return sourceFile.getStructure();
  },
});

// Agent with tool
const codeAgent = await AgentBuilder
  .withModel('glm-4.6')
  .withTools([parseCodeTool])
  .withSystemPrompt('You can parse TypeScript code using the parseCode tool.')
  .build();
```

---

## Hierarchical Multi-Agent System

```typescript
import { AgentBuilder, SequentialAgent } from '@iqai/adk';

// Create specialized agents
const specInterpreter = await AgentBuilder
  .withModel('glm-4.6')
  .withSystemPrompt('Analyze specifications and extract requirements.')
  .withTemperature(0.2)
  .build();

const codeGenerator = await AgentBuilder
  .withModel('glm-4.6')
  .withSystemPrompt('Generate code based on requirements.')
  .withTemperature(0.2)
  .build();

const testCrafter = await AgentBuilder
  .withModel('glm-4.6')
  .withSystemPrompt('Create comprehensive tests for generated code.')
  .withTemperature(0.3)
  .build();

// Orchestrate with SequentialAgent
const workflow = new SequentialAgent({
  name: 'CodeForge Workflow',
  agents: [
    specInterpreter.runner,
    codeGenerator.runner,
    testCrafter.runner,
  ],
});

const result = await workflow.run('Create a user authentication module...');
```

---

## Streaming Responses

```typescript
import { AgentBuilder } from '@iqai/adk';

const agent = await AgentBuilder
  .withModel('glm-4.6')
  .build();

const { runner } = agent;

// Stream responses
for await (const chunk of runner.stream('Generate a function...')) {
  process.stdout.write(chunk.content);
}
```

---

## Structured Output with Zod

```typescript
import { AgentBuilder } from '@iqai/adk';
import { z } from 'zod';

const outputSchema = z.object({
  functionName: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })),
  returnType: z.string(),
  implementation: z.string(),
  tests: z.string(),
});

const agent = await AgentBuilder
  .withModel('glm-4.6')
  .withOutputSchema(outputSchema)
  .build();

const result = await agent.runner.run('Generate a user authentication function');
// result is typed according to outputSchema
console.log(result.functionName);
console.log(result.implementation);
```

---

## Memory and Context

```typescript
import { AgentBuilder, VectorMemoryService } from '@iqai/adk';

// Create vector memory for project context
const memory = new VectorMemoryService({
  dimensions: 384, // all-MiniLM-L6-v2 embedding size
});

// Add project context
await memory.add({
  id: 'file-1',
  content: 'User.ts file content...',
  metadata: { filePath: 'src/models/User.ts' },
});

// Agent with memory
const agent = await AgentBuilder
  .withModel('glm-4.6')
  .withMemory(memory)
  .withSystemPrompt('Use project context to generate consistent code.')
  .build();

// Agent can now query memory during generation
const result = await agent.runner.run('Create a user service');
```

---

## Configuration Best Practices

### Environment Variables
```bash
# .env file
OPENAI_API_KEY=sk-...your-api-key...
LLM_MODEL=glm-4.6
ADK_LOG_LEVEL=info
```

### Temperature Settings
```typescript
// Deterministic generation (code, data structures)
const codeAgent = AgentBuilder.withTemperature(0.2);

// Creative generation (documentation, naming)
const docAgent = AgentBuilder.withTemperature(0.7);

// Debate/review (diverse perspectives)
const reviewAgent = AgentBuilder.withTemperature(0.8);
```

### Token Limits
```typescript
// Code generation (large outputs)
const generatorAgent = AgentBuilder.withMaxTokens(4096);

// Reviews/analysis (concise outputs)
const reviewAgent = AgentBuilder.withMaxTokens(1024);

// Quick validations (minimal outputs)
const validatorAgent = AgentBuilder.withMaxTokens(256);
```

---

## Error Handling

```typescript
import { AgentBuilder } from '@iqai/adk';

const agent = await AgentBuilder
  .withModel('glm-4.6')
  .build();

try {
  const result = await agent.runner.run('Generate code...');
  console.log(result);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Implement exponential backoff
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Retry...
  } else if (error.code === 'INVALID_API_KEY') {
    console.error('Check OPENAI_API_KEY environment variable');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Debugging

```typescript
import { AgentBuilder } from '@iqai/adk';

// Enable verbose logging
const agent = await AgentBuilder
  .withModel('glm-4.6')
  .withDebug(true) // Shows all LLM calls
  .build();

// Or use ADK's built-in telemetry
import { enableTelemetry } from '@iqai/adk';

enableTelemetry({
  serviceName: 'codeforge-ai',
  exporterUrl: 'http://localhost:4318/v1/traces',
});
```

---

## Import Paths

### Using Local ADK-TS Clone

```typescript
// Option 1: TypeScript path alias (recommended)
// Configure in tsconfig.json first
import { AgentBuilder } from '@iqai/adk';

// Option 2: Relative import
import { AgentBuilder } from '../../../adk-ts/packages/adk/src';
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@iqai/adk": ["../../adk-ts/packages/adk/src"],
      "@iqai/adk/*": ["../../adk-ts/packages/adk/src/*"]
    }
  }
}
```

---

## Common Patterns

### Debate Resolution

```typescript
import { AgentBuilder, ParallelAgent } from '@iqai/adk';

// Create multiple agents with different perspectives
const agents = await Promise.all([
  AgentBuilder.withModel('glm-4.6')
    .withSystemPrompt('Focus on code quality and maintainability.')
    .build(),
  AgentBuilder.withModel('glm-4.6')
    .withSystemPrompt('Focus on performance and optimization.')
    .build(),
  AgentBuilder.withModel('glm-4.6')
    .withSystemPrompt('Focus on security and best practices.')
    .build(),
]);

// Run in parallel
const debateAgent = new ParallelAgent({
  agents: agents.map(a => a.runner),
});

const opinions = await debateAgent.run('Review this code...');

// Lead agent resolves debate
const leadAgent = await AgentBuilder
  .withModel('glm-4.6')
  .withSystemPrompt('Synthesize opinions and make final decision.')
  .build();

const finalDecision = await leadAgent.runner.run(
  `Opinions: ${JSON.stringify(opinions)}\nMake final decision.`
);
```

### Incremental Code Generation

```typescript
import { AgentBuilder } from '@iqai/adk';

const agent = await AgentBuilder
  .withModel('glm-4.6')
  .build();

let context = 'Project: User Management System\n';

// Step 1: Generate interface
const interfaceCode = await agent.runner.run(
  context + 'Generate TypeScript User interface'
);
context += `\nGenerated interface:\n${interfaceCode}\n`;

// Step 2: Generate implementation
const implCode = await agent.runner.run(
  context + 'Generate UserService class implementing CRUD operations'
);
context += `\nGenerated service:\n${implCode}\n`;

// Step 3: Generate tests
const testCode = await agent.runner.run(
  context + 'Generate Jest tests for UserService'
);
```

---

## References

- **ADK-TS Docs**: https://adk.iqai.com/docs/framework/get-started
- **Local ADK Source**: `../adk-ts/packages/adk/src/`
- **Examples**: `../adk-ts/apps/examples/`
- **OpenAI Models**: ADK-TS supports all OpenAI models (gpt-3.5, gpt-4, gpt-4o, o1, o3, etc.)

---

**Created**: 2025-10-07  
**Last Updated**: 2025-10-07  
**Status**: Active
