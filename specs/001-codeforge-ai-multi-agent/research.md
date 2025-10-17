# Research: CodeForge AI - Multi-Agent System

**Date**: 2025-10-07  
**Feature**: CodeForge AI - Multi-Agent Code Generation System  
**Purpose**: Document technology decisions, best practices, and architectural patterns for implementation

---

## Technology Decisions

### 1. AI Framework: ADK-TS (@iqai/adk)

**Decision**: Use ADK-TS v2+ as the core multi-agent orchestration framework

**Rationale**:
- Native TypeScript support with strong typing for agent definitions
- Built-in hierarchical agent patterns (`asHierarchical()`) perfect for lead + specialized agents
- Integrated vector memory service for project context embeddings
- OpenTelemetry observability out-of-the-box
- Direct OpenAI integration with model specification per agent
- Tool/function calling abstraction compatible with MCP standard

**Alternatives Considered**:
- **LangChain**: Too heavyweight, Python-first with JS as secondary, less TypeScript-native
- **AutoGen**: Requires Python, not suitable for Node.js/TypeScript stack
- **Custom implementation**: Reinventing wheel, no built-in memory/orchestration patterns

**Best Practices**:
- Use `AgentBuilder` pattern for consistent agent construction
- Leverage `VectorMemoryService` for codebase embeddings
- Implement custom resolvers for debate logic
- Enable streaming for real-time UX feedback

**Local Development Setup**:
- **IMPORTANT**: We are using a **local clone** of adk-ts (already cloned to `../adk-ts`)
- Import from local folder instead of npm: `import { ADK } from '../../../adk-ts/src'`
- Configure TypeScript paths in `tsconfig.json` for `@iqai/adk-ts` alias
- See `local-adk-setup.md` for complete setup instructions
- Benefits: Direct source access, easier debugging, no npm publish cycle

---

### 2. LLM: OpenAI gpt-5-nano-2025-08-07

**Decision**: Exclusively use OpenAI's gpt-5-nano-2025-08-07 model for all LLM calls via ADK-TS

**Rationale**:
- Optimized for code generation tasks (fast, accurate)
- Cost-effective for high-volume operations
- ADK-TS provides built-in OpenAI integration (no separate SDK needed)
- Sufficient context window for code analysis
- Reliable function calling for tool execution

**Implementation**:
```typescript
// ADK-TS handles OpenAI SDK internally
import { AgentBuilder } from '@iqai/adk';

const agent = await AgentBuilder
  .withModel('gpt-5-nano-2025-08-07')  // Just specify model name
  .withTemperature(0.2)
  .withMaxTokens(4096)
  .build();
```

**Configuration**:
- Model: `gpt-5-nano-2025-08-07` (passed to `AgentBuilder.withModel()`)
- Temperature: 0.2 for generation (deterministic), 0.7 for debates (creative)
- Max tokens: 4096 for generation, 1024 for reviews
- System prompts: Role-specific per agent via `withSystemPrompt()`
- API Key: Set `OPENAI_API_KEY` environment variable (ADK-TS reads it automatically)

**Fallback Strategy**:
- Rate limit handling: Queue with exponential backoff
- API failure: Cache previous responses, graceful degradation
- No multi-model support in v1 (simplicity principle)

**Note**: ADK-TS includes `openai@^5.20.0` as a dependency - no need to install separately

---

### 3. Code Intelligence: ts-morph

**Decision**: Use ts-morph for AST parsing and code generation (TypeScript/JavaScript focus)

**Rationale**:
- Powerful TypeScript AST manipulation library
- Type-safe code transformations
- Project-aware analysis (resolves imports, types)
- Used by TypeScript compiler team
- Extensible to JavaScript via same API

**Capabilities**:
- Parse existing code into queryable AST
- Generate code from AST structures
- Refactor operations (rename, extract, inline)
- Symbol resolution for context extraction

**Limitations**:
- TypeScript/JavaScript only (Python via prompt-based generation)
- Performance on large codebases (requires chunking)

**Best Practices**:
- Create `Project` instance per repository scan
- Use `sourceFile.getDescendantsOfKind()` for targeted queries
- Cache AST results in vector memory
- Incremental parsing for large repos

---

### 4. Vector Embeddings: @xenova/transformers

**Decision**: Use @xenova/transformers (ONNX runtime) for local offline embeddings

**Rationale**:
- Pure JavaScript/WASM, no Python dependencies
- Runs entirely offline (privacy + speed)
- Compatible with ADK-TS `VectorMemoryService`
- Pre-trained models via Hugging Face
- Small footprint (<100MB with model)

**Model Selection**:
- `sentence-transformers/all-MiniLM-L6-v2` (default)
- Optimized for semantic similarity
- 384-dimensional embeddings
- Fast inference (<50ms per encoding)

**Alternatives Considered**:
- **OpenAI embeddings**: Requires API calls, cost, not offline
- **Cohere**: Same issues as OpenAI
- **Sentence-transformers (Python)**: Breaks Node.js-only requirement

---

### 5. Storage: lowdb

**Decision**: Use lowdb for local JSON-based persistence

**Rationale**:
- Simple file-based database (JSON)
- No external DB server required
- Perfect for local-first architecture
- Async API compatible with Node.js
- Versioned for consistency

**Schema**:
```typescript
{
  projects: {
    [repoPath: string]: {
      embeddings: number[][],
      fileStructure: object,
      lastScanned: Date,
      metadata: object
    }
  },
  history: {
    [id: string]: {
      prompt: string,
      output: CodeOutput,
      timestamp: Date,
      reviews: ReviewReport[]
    }
  }
}
```

**Alternatives Considered**:
- **SQLite**: Overkill for simple key-value, requires native binding
- **LevelDB**: More complex, no JSON support
- **In-memory only**: Loses context between sessions

---

### 6. Backend API: Express.js

**Decision**: Express.js for RESTful API endpoints

**Rationale**:
- Mature, well-documented Node.js framework
- Middleware ecosystem (CORS, rate limiting, validation)
- Easy integration with Socket.io for streaming
- Vercel serverless compatibility
- Minimal boilerplate

**API Design**:
- RESTful endpoints: `/generate`, `/review`, `/enhance`, `/onboard`
- JSON payloads with TypeScript validation (Zod)
- WebSocket for streaming agent thoughts
- Rate limiting per endpoint
- OpenAPI/Swagger docs

**Alternatives Considered**:
- **Fastify**: Faster but less mature ecosystem
- **NestJS**: Too heavyweight for this scope
- **tRPC**: TypeScript-first but non-standard API pattern

---

### 7. CLI: Commander.js

**Decision**: Commander.js for CLI implementation

**Rationale**:
- Standard Node.js CLI library
- Git-style subcommands (`codeforge generate`, `codeforge review`)
- Built-in help generation
- Option parsing with validation
- TypeScript support

**CLI Structure**:
```bash
codeforge onboard <repo-path> [--github-token]
codeforge generate <prompt> [--type=component|function|feature] [--apply]
codeforge review <file-path> [--fix]
codeforge enhance <file-path> --goal=<description> [--apply]
codeforge config [--key=<name>] [--value=<val>]
```

**Best Practices**:
- Colored output via chalk
- Progress spinners for long operations (ora)
- Table formatting for batch results (cli-table3)
- Stdin support for piping prompts

---

### 8. Frontend: React + Vite

**Decision**: React 18 with Vite for web UI

**Rationale**:
- Fast dev server (<100ms HMR)
- Smaller bundle than webpack
- Native ESM support
- TypeScript first-class
- Production-ready SSR/SSG if needed

**UI Libraries**:
- **Monaco Editor** (@monaco-editor/react): VS Code editor component
- **react-diff-viewer**: Side-by-side code diffs
- **Socket.io-client**: Real-time agent streaming
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management

**Alternatives Considered**:
- **Next.js**: Too heavy for SPA, unnecessary SSR
- **Vue/Svelte**: Team TypeScript/React expertise

---

### 9. Testing Strategy

**Decision**: Multi-layered testing with Jest + Vitest

**Rationale**:
- **Jest** (backend): Mature, TypeScript support, mocking
- **Vitest** (frontend): Vite-native, faster than Jest for React
- **Contract tests**: Supertest for API endpoints
- **Integration tests**: Full workflow validation
- **Mock LLM**: Predefined responses for deterministic tests

**Test Structure**:
```
- Unit tests: Agent logic, tools, services (80%+ coverage)
- Contract tests: All API endpoints (100% coverage)
- Integration tests: Onboard → Generate → Review → Apply
- Performance tests: <10s operations, memory limits
- Snapshot tests: Generated code output consistency
```

**CI Pipeline**:
- Pre-commit: Lint + format (Husky)
- PR: Full test suite + coverage report
- Main: Deploy preview (Vercel)

---

### 10. Deployment: Vercel

**Decision**: Vercel for serverless deployment + static hosting

**Rationale**:
- Zero-config TypeScript deployment
- Serverless functions from Express routes
- Edge network for global <100ms latency
- Free tier sufficient for development
- Git integration for CI/CD

**Architecture**:
- API routes → Vercel serverless functions
- React build → Static hosting on Vercel CDN
- Environment variables → Vercel dashboard
- KV storage (optional) → Session persistence

**Local Development**:
- `npm run dev` → Concurrent backend + frontend
- Backend: `localhost:3000`
- Frontend: `localhost:5173`
- VS Code extension → Calls localhost:3000

**Alternatives Considered**:
- **AWS Lambda**: More complex setup, cold starts
- **Railway**: Less mature, fewer integrations
- **Self-hosted**: Ops burden, no CDN

---

## Architectural Patterns

### Hierarchical Multi-Agent Pattern

```typescript
const codeForgeWorkflow = AgentBuilder
  .asHierarchical({
    master: leadEngineerAgent,
    subs: [
      specInterpreter,
      codeGenerator,
      bugHunter,
      securitySentinel,
      performanceProfiler,
      testCrafter,
      docWeaver
    ],
    resolver: debateMediator // Custom LLM-powered voting
  })
  .withMemory(vectorMemoryService)
  .withTools([githubMcpTool, sonarqubeMcpTool])
  .build();
```

**Flow**:
1. Lead receives user prompt
2. Parallel: Subs generate proposals
3. Debate: Resolver votes on best approach
4. Sequential: Generate → Review → Refine
5. Stream: Real-time progress to UI

### Tool/MCP Integration Pattern

```typescript
export const githubMcpTool = {
  name: 'fetch_github_examples',
  description: 'Fetch similar code from GitHub',
  parameters: { query: 'string', language: 'string' },
  execute: async (params) => {
    if (!process.env.GITHUB_TOKEN) {
      return { fallback: 'local_patterns', message: 'GitHub disabled' };
    }
    // Octokit API call
  }
};
```

**Principles**:
- Graceful degradation when integrations unavailable
- Cache results for offline operation
- Rate limit awareness

### Streaming Architecture

```typescript
// Backend: Generator function
async function* streamGeneration(prompt: string) {
  yield { phase: 'parsing', message: 'Analyzing prompt...' };
  yield { phase: 'generating', code: partialCode };
  yield { phase: 'reviewing', feedback: reviews };
  yield { phase: 'complete', output: finalCode };
}

// Frontend: WebSocket consumer
socket.on('generation', (chunk) => {
  if (chunk.phase === 'generating') {
    editor.setValue(chunk.code); // Live preview
  }
});
```

---

## Integration Decisions

### GitHub MCP Tool
- **Purpose**: Fetch similar code examples, PR patterns
- **API**: Octokit REST API
- **Rate Limits**: 5,000 req/hr authenticated
- **Fallback**: Local pattern matching

### SonarQube MCP Tool
- **Purpose**: Advanced static analysis of generated code
- **API**: SonarQube REST API
- **Deployment**: Optional self-hosted or cloud
- **Fallback**: Local rule-based checks (ESLint patterns)

---

## Performance Optimizations

1. **Lazy Loading**: Load agent tools on-demand
2. **Caching**: Cache embeddings, API responses, parsed ASTs
3. **Chunking**: Process large codebases incrementally
4. **Debouncing**: Batch UI updates for streaming
5. **Worker Threads**: Offload embedding generation
6. **Memoization**: Cache agent decisions for similar prompts

---

## Security Considerations

1. **API Key Storage**: Environment variables only, never committed
2. **Sandbox Execution**: Generated code runs in developer's environment (user responsibility)
3. **Input Validation**: Zod schemas for all API inputs
4. **Rate Limiting**: Prevent abuse of local endpoints
5. **Dependency Scanning**: Snyk in CI for vulnerabilities
6. **No Telemetry**: User code never sent to external services except OpenAI

---

## Extensibility: YAML Plugin System

**Future Enhancement**: Load custom agents via YAML

```yaml
# plugins/agents/go-generator.yml
name: GoCodeGenerator
description: Generates Go code from prompts
model: gpt-5-nano-2025-08-07
tools:
  - go_ast_parser
  - go_formatter
systemPrompt: |
  You are an expert Go developer...
```

**Implementation**: Parse YAML → Hydrate `AgentBuilder` → Register in factory

---

## Known Limitations

1. **Languages**: TS/JS/Python in v1, others prompt-based (no AST)
2. **Offline**: Requires internet for OpenAI (embeddings are offline)
3. **Context Window**: 4K tokens (may truncate large files)
4. **Concurrency**: Single generation at a time (queue for multiple)
5. **VS Code**: Extension requires backend running (localhost or remote)

---

## References

- [ADK-TS Documentation](https://github.com/iqai/adk-ts)
- [ts-morph Guide](https://ts-morph.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [@xenova/transformers](https://github.com/xenova/transformers.js)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Vercel Deployment Docs](https://vercel.com/docs)

---

**All NEEDS CLARIFICATION resolved**: ✅  
**Ready for Phase 1 (Design)**
