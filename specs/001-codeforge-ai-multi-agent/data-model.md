# Data Model: CodeForge AI

**Date**: 2025-10-07  
**Feature**: CodeForge AI - Multi-Agent Code Generation System  
**Purpose**: Define core data structures, entities, relationships, and validation rules

---

## Core Entities

### 1. ProjectContext

**Purpose**: Represents an onboarded codebase with all contextual information for code generation

**Fields**:
```typescript
interface ProjectContext {
  id: string;                      // UUID
  repoPath: string;                // Absolute file path
  name: string;                    // Project name from package.json or dir name
  language: 'typescript' | 'javascript' | 'python' | 'mixed';
  framework?: string;              // e.g., 'react', 'express', 'fastapi'
  embeddings: Embedding[];         // Vector embeddings of code
  fileStructure: FileNode;         // AST of project structure
  dependencies: Dependency[];      // package.json dependencies
  conventions: CodeConventions;    // Detected patterns (naming, style)
  metadata: {
    created: Date;
    lastScanned: Date;
    totalFiles: number;
    totalLines: number;
    version: string;               // Semantic version
  };
}

interface Embedding {
  filePath: string;
  chunk: string;                   // Code chunk (~500 tokens)
  vector: number[];                // 384-dim from all-MiniLM-L6-v2
  metadata: {
    type: 'function' | 'class' | 'interface' | 'module';
    name?: string;
    lineStart: number;
    lineEnd: number;
  };
}

interface FileNode {
  path: string;
  type: 'file' | 'directory';
  language?: string;
  imports?: string[];
  exports?: string[];
  children?: FileNode[];
}

interface Dependency {
  name: string;
  version: string;
  type: 'runtime' | 'dev' | 'peer';
}

interface CodeConventions {
  namingStyle: 'camelCase' | 'snake_case' | 'PascalCase';
  indentation: 'tabs' | '2spaces' | '4spaces';
  quotes: 'single' | 'double';
  semicolons: boolean;
  testFramework?: 'jest' | 'vitest' | 'pytest';
}
```

**Validation Rules**:
- `repoPath` MUST be absolute and exist on filesystem
- `embeddings` MUST have at least one entry after onboarding
- `fileStructure` MUST reflect actual directory tree
- `metadata.lastScanned` MUST be <= current time

**Relationships**:
- Has many `GenerationRequest` (history)
- Referenced by `Agent` memory

---

### 2. Agent

**Purpose**: Represents an AI agent instance with role, configuration, and state

**Fields**:
```typescript
interface Agent {
  id: string;                      // UUID
  type: AgentType;
  role: string;                    // Human-readable role description
  model: 'gpt-5-mini';             // LLM model name (passed to ADK-TS)
  systemPrompt: string;            // Role-specific instructions
  tools: Tool[];                   // Available tools
  temperature: number;             // 0-1, default 0.2
  maxTokens: number;               // Default 4096
  memory: {
    contextId?: string;            // ProjectContext reference
    conversationHistory: Message[];
    embeddings?: number[][];       // Cached context vectors
  };
  metrics: {
    totalCalls: number;
    avgResponseTime: number;       // milliseconds
    successRate: number;           // 0-1
    lastUsed: Date;
  };
}

// Note: Model is just a string identifier passed to ADK-TS AgentBuilder.withModel()
// ADK-TS handles the OpenAI SDK integration internally - no separate SDK installation needed

type AgentType = 
  | 'lead'                         // LeadEngineerAgent
  | 'spec-interpreter'             // SpecInterpreterAgent
  | 'code-generator'               // CodeGeneratorAgent
  | 'bug-hunter'                   // BugHunterAgent
  | 'refactor-guru'                // RefactorGuruAgent
  | 'security-sentinel'            // SecuritySentinelAgent
  | 'performance-profiler'         // PerformanceProfilerAgent
  | 'test-crafter'                 // TestCrafterAgent
  | 'doc-weaver';                  // DocWeaverAgent

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: any) => Promise<any>;
}

interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**Validation Rules**:
- `type` MUST be one of defined AgentType values
- `temperature` MUST be 0 ≤ temp ≤ 1
- `systemPrompt` MUST be non-empty
- `tools` array CAN be empty (not all agents use tools)

**Relationships**:
- Belongs to `CodeForgeWorkflow`
- Generates `CodeOutput`, `ReviewReport`, `EnhancementProposal`

---

### 3. GenerationRequest

**Purpose**: Captures user's code generation intent and parameters

**Fields**:
```typescript
interface GenerationRequest {
  id: string;                      // UUID
  prompt: string;                  // Natural language description
  type: 'component' | 'function' | 'feature' | 'custom';
  language?: 'typescript' | 'javascript' | 'python'; // Auto-detect if null
  context: {
    projectId?: string;            // ProjectContext reference
    relatedFiles?: string[];       // Relevant existing files
    targetPath?: string;           // Where to place generated code
  };
  options: {
    generateTests: boolean;        // Default true
    autoReview: boolean;           // Default true
    applyChanges: boolean;         // Default false (user confirms)
    iterationLimit: number;        // Max refinement cycles, default 3
  };
  metadata: {
    userId?: string;
    source: 'cli' | 'web' | 'vscode';
    timestamp: Date;
    sessionId?: string;            // Group related requests
  };
}
```

**Validation Rules**:
- `prompt` MUST be non-empty, max 10,000 characters
- `type` MUST be valid enum value
- `language` MUST match supported languages if specified
- `options.iterationLimit` MUST be 1 ≤ limit ≤ 10

**Relationships**:
- Creates one `CodeOutput`
- May trigger multiple `ReviewReport` (iterations)

---

### 4. CodeOutput

**Purpose**: Result of code generation with all associated metadata

**Fields**:
```typescript
interface CodeOutput {
  id: string;                      // UUID
  requestId: string;               // GenerationRequest reference
  code: string;                    // Generated source code
  language: string;
  filePath?: string;               // Suggested file path
  tests?: string;                  // Generated test code
  testFilePath?: string;
  formatting: {
    prettier: boolean;             // Was Prettier applied?
    linter: 'eslint' | 'none';
  };
  validation: {
    syntaxValid: boolean;
    testsGenerated: boolean;
    testsPass: boolean;
    reviewScore?: number;          // 0-100 from auto-review
  };
  confidence: {
    overall: number;               // 0-1, agent confidence
    breakdown: {
      correctness: number;
      completeness: number;
      efficiency: number;
      style: number;
    };
  };
  rationale: string;               // Agent's explanation of choices
  alternatives?: CodeAlternative[]; // Debate proposals not selected
  metadata: {
    generatedBy: string;           // Agent ID
    generationTime: number;        // milliseconds
    tokensUsed: number;
    timestamp: Date;
    iteration: number;             // Refinement cycle number
  };
}

interface CodeAlternative {
  approach: string;                // Description
  code: string;
  score: number;                   // Debate resolver score
  pros: string[];
  cons: string[];
}
```

**Validation Rules**:
- `code` MUST be non-empty
- `confidence.overall` MUST be 0 ≤ conf ≤ 1
- `validation.syntaxValid` MUST be true before delivery
- If `tests` exists, `testsPass` MUST be checked

**Relationships**:
- Belongs to one `GenerationRequest`
- Has many `ReviewReport`
- May have one `EnhancementProposal`

---

### 5. ReviewReport

**Purpose**: Multi-agent analysis results for code review

**Fields**:
```typescript
interface ReviewReport {
  id: string;                      // UUID
  targetId: string;                // CodeOutput or external file reference
  targetType: 'generated' | 'existing';
  findings: Finding[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    overallScore: number;          // 0-100
  };
  agentReviews: AgentReview[];     // Per-agent perspectives
  recommendations: string[];       // Prioritized fix suggestions
  metadata: {
    reviewedBy: string[];          // Agent IDs
    reviewTime: number;            // milliseconds
    timestamp: Date;
  };
}

interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'bug' | 'security' | 'performance' | 'style' | 'documentation';
  message: string;                 // What's wrong
  suggestion: string;              // How to fix
  location: {
    file: string;
    lineStart: number;
    lineEnd: number;
    column?: number;
  };
  rule?: string;                   // ESLint rule, OWASP ID, etc.
  confidence: number;              // 0-1
  detectedBy: string;              // Agent ID
}

interface AgentReview {
  agentType: AgentType;
  focus: string;                   // What this agent checks
  findings: string[];              // Finding IDs
  overallAssessment: string;
  score: number;                   // 0-100
}
```

**Validation Rules**:
- `findings` array CAN be empty (clean code)
- `severity` MUST map to numeric priority for sorting
- `location.lineStart` MUST be ≤ `lineEnd`
- `summary` counts MUST match `findings` array

**Relationships**:
- References one `CodeOutput` or external file
- Created by multiple `Agent` (collaborative)

---

### 6. EnhancementProposal

**Purpose**: Code improvement suggestion with diff and rationale

**Fields**:
```typescript
interface EnhancementProposal {
  id: string;                      // UUID
  sourceId: string;                // CodeOutput or file reference
  goal: string;                    // User's enhancement objective
  originalCode: string;
  enhancedCode: string;
  diff: DiffChunk[];               // Structured diff
  changes: Change[];               // High-level change descriptions
  impact: {
    linesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    complexityDelta: number;       // Change in cyclomatic complexity
    estimatedEffort: 'low' | 'medium' | 'high';
  };
  rationale: string;               // Why these changes
  risks: string[];                 // Potential breaking changes
  metadata: {
    proposedBy: string;            // Agent ID
    timestamp: Date;
  };
}

interface DiffChunk {
  type: 'add' | 'remove' | 'modify';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
}

interface Change {
  type: 'refactor' | 'optimize' | 'fix' | 'feature' | 'style';
  description: string;
  affected: string[];              // Functions/classes changed
  testImpact: 'none' | 'update' | 'new';
}
```

**Validation Rules**:
- `originalCode` and `enhancedCode` MUST not be empty
- `diff` MUST accurately reflect changes
- `impact.estimatedEffort` based on `linesChanged` heuristic

**Relationships**:
- Enhances one `CodeOutput` or external file
- May trigger new `GenerationRequest` if applied

---

### 7. Tool (External Integration)

**Purpose**: Configuration and state for external service connections

**Fields**:
```typescript
interface ToolIntegration {
  id: string;
  name: 'github' | 'sonarqube' | 'custom';
  enabled: boolean;
  config: {
    apiKey?: string;               // Env var reference, not literal
    baseUrl?: string;
    timeout: number;               // milliseconds
    retries: number;
  };
  state: {
    connected: boolean;
    lastHealthCheck: Date;
    rateLimitRemaining?: number;
    rateLimitReset?: Date;
  };
  cache: {
    enabled: boolean;
    ttl: number;                   // seconds
    entries: CacheEntry[];
  };
  fallback: {
    strategy: 'local' | 'cached' | 'disable';
    localRules?: string[];         // For code analysis
  };
}

interface CacheEntry {
  key: string;                     // Request hash
  value: any;
  expires: Date;
}
```

**Validation Rules**:
- `config.apiKey` MUST NOT store literal keys (use env references)
- `state.connected` updated every health check
- `cache.ttl` default 3600 (1 hour)

**Relationships**:
- Used by `Agent` tools
- Optionally enriches `CodeOutput` and `ReviewReport`

---

### 8. GenerationHistory

**Purpose**: Chronological log for iterative development tracking

**Fields**:
```typescript
interface GenerationHistory {
  id: string;                      // UUID
  projectId: string;               // ProjectContext reference
  entries: HistoryEntry[];
  metadata: {
    created: Date;
    lastUpdated: Date;
    totalGenerations: number;
  };
}

interface HistoryEntry {
  id: string;
  type: 'generate' | 'review' | 'enhance' | 'apply';
  timestamp: Date;
  requestId?: string;              // GenerationRequest
  outputId?: string;               // CodeOutput
  reviewId?: string;               // ReviewReport
  proposalId?: string;             // EnhancementProposal
  action: string;                  // Human-readable action
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  metadata: {
    duration: number;              // milliseconds
    filesAffected: string[];
  };
}
```

**Validation Rules**:
- `entries` sorted by `timestamp` ascending
- Each entry MUST reference valid entity IDs
- `type` determines which ID fields are required

**Relationships**:
- Belongs to one `ProjectContext`
- References all other entities via IDs

---

## Entity Relationships Diagram

```
ProjectContext
  ├── 1:N → GenerationRequest
  │         └── 1:1 → CodeOutput
  │                   ├── 1:N → ReviewReport
  │                   └── 0:1 → EnhancementProposal
  ├── 1:N → GenerationHistory
  └── N:M → Agent (via memory)

Agent
  ├── N:M → Tool
  └── creates → CodeOutput, ReviewReport, EnhancementProposal

ToolIntegration
  └── used by → Agent
```

---

## State Transitions

### GenerationRequest Lifecycle
```
CREATED → PARSING → GENERATING → REVIEWING → REFINING → COMPLETED
                                    ↓          ↑
                                    ← FAILED ←
```

### CodeOutput States
```
DRAFT → VALIDATED → REVIEWED → (APPLIED | REJECTED)
```

### ReviewReport States
```
PENDING → IN_PROGRESS → COMPLETED
```

---

## Data Validation

### Runtime Validation with Zod

```typescript
import { z } from 'zod';

export const GenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  type: z.enum(['component', 'function', 'feature', 'custom']),
  language: z.enum(['typescript', 'javascript', 'python']).optional(),
  options: z.object({
    generateTests: z.boolean().default(true),
    autoReview: z.boolean().default(true),
    applyChanges: z.boolean().default(false),
    iterationLimit: z.number().int().min(1).max(10).default(3)
  })
});

export const CodeOutputSchema = z.object({
  code: z.string().min(1),
  confidence: z.object({
    overall: z.number().min(0).max(1)
  }),
  validation: z.object({
    syntaxValid: z.boolean(),
    testsPass: z.boolean()
  })
}).refine(
  data => data.validation.syntaxValid === true,
  'Code must be syntactically valid'
);
```

---

## Persistence Strategy

### lowdb Schema
```json
{
  "projects": {
    "[projectId]": { ProjectContext }
  },
  "generations": {
    "[requestId]": { GenerationRequest }
  },
  "outputs": {
    "[outputId]": { CodeOutput }
  },
  "reviews": {
    "[reviewId]": { ReviewReport }
  },
  "history": {
    "[projectId]": { GenerationHistory }
  },
  "integrations": {
    "[toolName]": { ToolIntegration }
  }
}
```

### File Locations
- **Dev**: `~/.codeforge/db.json`
- **Prod**: User-specified or same as dev
- **Backup**: Daily snapshots to `~/.codeforge/backups/`

---

## Migration Strategy

**Versioning**: `metadata.version` field in each entity

**Schema Changes**:
1. Detect version mismatch on load
2. Apply migration scripts sequentially
3. Backup before migration
4. Validate post-migration with Zod

**Example Migration (v1 → v2)**:
```typescript
export function migrateV1toV2(data: any): any {
  return {
    ...data,
    version: '2.0.0',
    // Add new fields
    confidence: data.confidence || { overall: 0.8 }
  };
}
```

---

## Performance Considerations

1. **Indexing**: In-memory index for fast ProjectContext lookup by path
2. **Pagination**: Limit `GenerationHistory` entries to last 1000
3. **Lazy Loading**: Load embeddings on-demand, not with ProjectContext
4. **Compression**: gzip large code strings in storage
5. **Pruning**: Archive history entries older than 90 days

---

**All entities defined**: ✅  
**Validation rules specified**: ✅  
**Ready for contract generation (Phase 1 continuation)**
