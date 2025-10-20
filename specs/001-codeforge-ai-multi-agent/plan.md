
# Implementation Plan: CodeForge AI -#### Core Dependencies
- **AI Framework**: Local `adk-ts` clone (from `../adk-ts`) - Hierarchical multi-agent orchestration
  - **Note**: Using local development version instead of npm package
  - **Includes**: Built-in OpenAI SDK integration (no separate `openai` package needed)
- **AI Model**: `gpt-5-mini-2025-08-07` - Accessed via ADK-TS `AgentBuilder.withModel('gpt-5-mini-2025-08-07')`Multi-Agent System

**Branch**: `001-codeforge-ai-multi-agent` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-codeforge-ai-multi-agent/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: Build a full-stack TypeScript multi-agent AI system powered by ADK-TS that acts as a virtual development team for solo developers. The system generates, reviews, and enhances code from natural language specifications using hierarchical AI agents that collaborate and debate on implementation choices.

**Technical Approach**: 
- **Architecture**: Monolithic Node.js backend with modular agent system, thin clients (CLI/Web/VSCode)
- **AI Framework**: ADK-TS v2+ with hierarchical multi-agent workflows using OpenAI gpt-5-mini-2025-08-07 exclusively
- **Agent System**: Lead orchestrator + 7 specialized agents (SpecInterpreter, CodeGenerator, BugHunter, SecuritySentinel, PerformanceProfiler, TestCrafter, DocWeaver) with debate-driven consensus
- **Code Intelligence**: ts-morph for AST parsing/generation, local vector embeddings via @xenova/transformers
- **Interfaces**: Commander.js CLI, React/Vite web UI with Monaco editor, VS Code extension
- **Storage**: Local-first with lowdb (JSON file persistence), no external database
- **Integrations**: Optional MCP wrappers for GitHub (Octokit) and SonarQube with local fallbacks
- **Deployment**: Serverless-first (Vercel functions + static hosting), local dev mode support

## Technical Context
**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+  
**Primary Dependencies**: @iqai/adk v2+, express, commander, ts-morph, @xenova/transformers, lowdb, socket.io, prettier, jest  
**Storage**: Local JSON files via lowdb for project contexts and generation history  
**Testing**: Jest for unit/integration tests, Vitest for frontend, test execution on generated code  
**Target Platform**: Node.js backend (Vercel serverless), React SPA (static hosting), VS Code extension  
**Project Type**: web (monorepo: backend API + frontend UI + VS Code extension)  
**Performance Goals**: <10s quick operations, <30s full generation cycle, real-time streaming for UI  
**Constraints**: API: <200ms p95, CLI: <1s interactive, Memory: <512MB typical, offline embedding generation  
**Scale/Scope**: Solo devs/small teams, supports TS/JS/Python generation, extensible to additional languages via YAML plugins

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality Standards**
- [x] Cyclomatic complexity ≤15 per function planned (agent methods, API handlers modular)
- [x] Public API documentation approach defined (TSDoc for all exports, README with examples)
- [x] Static analysis tools identified (ESLint + TypeScript strict, Prettier for formatting)
- [x] Code review process planned (PR reviews required, constitutional checklist)

**II. Testing Discipline**
- [x] TDD workflow will be followed (tests → fail → implement → pass)
- [x] Contract test coverage: 100% of APIs (all Express endpoints, agent tool interfaces)
- [x] Integration test coverage: All user workflows (onboard, generate, review, enhance, apply)
- [x] Unit test coverage target: ≥80% for business logic (agent logic, AST parsing, workflow orchestration)
- [x] Performance test approach defined (benchmark tests for <10s operations, load testing for API endpoints)

**III. User Experience Consistency**
- [x] UI/CLI patterns consistent with existing features (verb-noun CLI commands: `codeforge generate`, `codeforge review`)
- [x] Error messages are actionable (what + how to fix: e.g., "OpenAI API key not found. Set OPENAI_API_KEY in .env")
- [x] Accessibility requirements identified (WCAG 2.1 AA for web UI, screen-reader compatible CLI output)
- [x] User documentation planned (comprehensive README, quickstart guide, inline help, demo GIF)

**IV. Performance Requirements**
- [x] Response time budgets defined (API: <200ms p95, CLI interactive: <1s, full generation: <30s)
- [x] Resource constraints identified (Memory: <512MB typical workload, CPU: <50% under normal load)
- [x] Scalability approach defined (stateless Vercel functions, horizontal scaling ready, local vector DB)
- [x] Performance testing strategy defined (Jest benchmarks, load testing with 2x peak, performance regression tests in CI)

**Violations Requiring Justification**: None - all constitutional principles satisfied

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Monorepo structure for full-stack application
adk-ts/                            # Local ADK-TS clone (imported from GitHub)
├── src/                           # ADK source code
├── package.json
└── tsconfig.json

backend/
├── src/
│   ├── agents/                    # ADK-TS agent definitions
│   │   ├── base/
│   │   │   ├── LeadEngineerAgent.ts
│   │   │   └── AgentFactory.ts
│   │   ├── specialized/
│   │   │   ├── SpecInterpreterAgent.ts
│   │   │   ├── CodeGeneratorAgent.ts
│   │   │   ├── BugHunterAgent.ts
│   │   │   ├── SecuritySentinelAgent.ts
│   │   │   ├── PerformanceProfilerAgent.ts
│   │   │   ├── TestCrafterAgent.ts
│   │   │   └── DocWeaverAgent.ts
│   │   └── resolvers/
│   │       └── DebateMediator.ts
│   ├── workflows/                 # ADK-TS workflow orchestration
│   │   ├── CodeForgeWorkflow.ts   # Main hierarchical workflow
│   │   ├── GenerateWorkflow.ts
│   │   ├── ReviewWorkflow.ts
│   │   └── EnhanceWorkflow.ts
│   ├── tools/                     # Agent tools (MCP-compatible)
│   │   ├── code/
│   │   │   ├── codeParseTool.ts   # AST parsing via ts-morph
│   │   │   ├── codeScaffoldTool.ts
│   │   │   ├── astQueryTool.ts
│   │   │   ├── patternMatcherTool.ts
│   │   │   └── commentInserterTool.ts
│   │   ├── testing/
│   │   │   ├── testGenTool.ts
│   │   │   └── testExecutorTool.ts
│   │   ├── analysis/
│   │   │   ├── complexityCalculator.ts
│   │   │   └── promptParserTool.ts
│   │   └── integrations/
│   │       ├── githubMcpTool.ts   # GitHub API wrapper
│   │       └── sonarqubeMcpTool.ts
│   ├── services/                  # Business logic services
│   │   ├── ProjectContextService.ts
│   │   ├── EmbeddingService.ts    # @xenova/transformers wrapper
│   │   ├── VectorMemoryManager.ts
│   │   ├── CodeFormatterService.ts
│   │   ├── DiffGeneratorService.ts
│   │   └── ValidationService.ts
│   ├── api/                       # Express API endpoints
│   │   ├── routes/
│   │   │   ├── generate.ts        # POST /generate
│   │   │   ├── review.ts          # POST /review
│   │   │   ├── enhance.ts         # POST /enhance
│   │   │   ├── onboard.ts         # POST /onboard
│   │   │   └── status.ts          # GET /status
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   └── server.ts              # Express app setup
│   ├── cli/                       # Commander.js CLI
│   │   ├── commands/
│   │   │   ├── onboard.ts
│   │   │   ├── generate.ts
│   │   │   ├── review.ts
│   │   │   ├── enhance.ts
│   │   │   └── config.ts
│   │   └── index.ts               # CLI entry point
│   ├── models/                    # Data models
│   │   ├── ProjectContext.ts
│   │   ├── GenerationRequest.ts
│   │   ├── CodeOutput.ts
│   │   ├── ReviewReport.ts
│   │   ├── EnhancementProposal.ts
│   │   └── AgentState.ts
│   ├── storage/                   # Persistence layer
│   │   ├── LocalDatabase.ts       # lowdb wrapper
│   │   └── schemas/
│   │       ├── contextSchema.ts
│   │       └── historySchema.ts
│   └── utils/                     # Utilities
│       ├── logger.ts              # Structured logging
│       ├── config.ts              # Config management
│       ├── telemetry.ts           # OpenTelemetry setup
│       └── errors.ts
├── tests/
│   ├── contract/                  # API contract tests
│   ├── integration/               # E2E workflow tests
│   └── unit/                      # Unit tests for agents/services
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/                # React components
│   │   ├── CodeEditor.tsx         # Monaco editor wrapper
│   │   ├── DiffViewer.tsx         # react-diff-viewer wrapper
│   │   ├── AgentChat.tsx          # Agent thought stream
│   │   ├── GenerationForm.tsx
│   │   ├── ReviewPanel.tsx
│   │   └── StatusIndicator.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GeneratePage.tsx
│   │   ├── ReviewPage.tsx
│   │   └── HistoryPage.tsx
│   ├── services/
│   │   ├── apiClient.ts           # Axios API wrapper
│   │   └── websocketClient.ts     # Socket.io streaming
│   ├── hooks/
│   │   ├── useGeneration.ts
│   │   ├── useReview.ts
│   │   └── useWebSocket.ts
│   ├── stores/                    # State management (Zustand)
│   │   ├── generationStore.ts
│   │   └── uiStore.ts
│   └── App.tsx
├── tests/
│   └── unit/
├── package.json
├── tsconfig.json
└── vite.config.ts

vscode-extension/
├── src/
│   ├── extension.ts               # Extension activation
│   ├── commands/
│   │   ├── generateFromSelection.ts
│   │   ├── reviewCurrentFile.ts
│   │   └── enhanceSelection.ts
│   ├── providers/
│   │   └── CodeActionProvider.ts
│   └── utils/
│       └── apiClient.ts           # Call localhost backend
├── package.json                   # VS Code extension manifest
└── tsconfig.json

shared/                            # Shared types/utilities
├── src/
│   ├── types/
│   │   ├── Agent.ts
│   │   ├── Request.ts
│   │   ├── Response.ts
│   │   └── Config.ts
│   └── constants/
│       └── prompts.ts             # Shared prompt templates
├── package.json
└── tsconfig.json

docs/
├── quickstart.md
├── api.md
├── agent-architecture.md
└── deployment.md

.github/
├── workflows/
│   ├── ci.yml                     # Jest + ESLint
│   └── deploy.yml                 # Vercel deployment
└── copilot-instructions.md

scripts/
├── setup-dev.sh
├── build-all.sh
└── test-all.sh

# Root configuration files
package.json                       # Workspace root (npm workspaces)
tsconfig.json                      # Base TS config
.env.example                       # Environment template
.eslintrc.js
.prettierrc
jest.config.js
vercel.json                        # Vercel deployment config
```

**Structure Decision**: Web application monorepo with npm workspaces. Backend (Express API + CLI), Frontend (React SPA), VS Code extension as separate packages, shared types package for consistency. This structure supports independent development and deployment while sharing common code.

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE

**Completed Activities**:
1. ✅ Extracted technical unknowns - all resolved with user-provided tech stack
2. ✅ Researched technology choices (ADK-TS, ts-morph, @xenova/transformers, lowdb, Express, React/Vite)
3. ✅ Documented best practices for each technology
4. ✅ Evaluated alternatives and documented rationale
5. ✅ Defined architectural patterns (hierarchical agents, MCP tools, streaming)
6. ✅ Identified integration strategies (GitHub, SonarQube with graceful fallbacks)

**Output**: `research.md` - 10 technology decisions with rationale, alternatives, best practices, and architectural patterns

**No NEEDS CLARIFICATION remaining** - all technical context provided by user

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

**Completed Activities**:

1. ✅ **Extracted entities** → `data-model.md`:
   - 8 core entities: ProjectContext, Agent, GenerationRequest, CodeOutput, ReviewReport, EnhancementProposal, ToolIntegration, GenerationHistory
   - Complete TypeScript interfaces with field descriptions
   - Validation rules with Zod schemas
   - Entity relationships and state transitions
   - Persistence strategy with lowdb

2. ✅ **Generated API contracts** → `/contracts/*.md`:
   - `onboard.md`: POST /onboard - Repository onboarding with progress streaming
   - `generate.md`: POST /generate - Code generation with auto-review
   - `review.md`: POST /review - Multi-agent code review
   - `enhance.md`: POST /enhance - Code improvement with diffs
   - Each contract includes: request/response schemas, error handling, WebSocket streaming, test scenarios

3. ✅ **Contract tests**: Ready to implement (test-first approach)
   - Test files will be created in `/tasks` phase
   - Contracts define expected behavior for TDD

4. ✅ **Extracted test scenarios** → `quickstart.md`:
   - 7 comprehensive test scenarios covering all workflows
   - Step-by-step instructions with expected outputs
   - Performance benchmarks defined
   - Success criteria documented

5. ⏭️  **Update agent file**: Deferred to post-planning
   - Will run after initial implementation
   - Agent context file will include ADK-TS, TypeScript, Express, React patterns

**Output**: 
- ✅ `data-model.md` (8 entities, validation, persistence)
- ✅ `/contracts/` (4 API contracts: onboard, generate, review, enhance)
- ✅ `quickstart.md` (7 test scenarios, benchmarks)
- ⏭️  Agent file (post-implementation)

## Phase 2: Task Planning Approach

**Status**: ✅ DOCUMENTED (NOT executed - per template instructions)

**Task Generation Strategy for /tasks command**:

1. **Source Documents**:
   - Load `.specify/templates/tasks-template.md` as base structure
   - Parse `contracts/*.md` for API endpoint tasks
   - Parse `data-model.md` for entity/model tasks
   - Parse `quickstart.md` for integration test scenarios
   - Parse `research.md` for setup/configuration tasks

2. **Task Categories** (estimated 80-100 tasks):
   
   **Setup & Configuration** (8-10 tasks):
   - Initialize monorepo with npm workspaces
   - Configure TypeScript for backend/frontend/extension/shared
   - Setup ESLint, Prettier, Husky
   - Configure Jest (backend) and Vitest (frontend)
   - Create .env.example and environment validation
   - Setup Vercel configuration
   - Initialize git repository structure
   - Configure CI/CD workflows

   **Data Models** (8 tasks) [P]:
   - Create ProjectContext model with Zod validation
   - Create Agent model with tool integration
   - Create GenerationRequest model
   - Create CodeOutput model  
   - Create ReviewReport model with findings
   - Create EnhancementProposal model with diff
   - Create ToolIntegration model
   - Create GenerationHistory model

   **Storage Layer** (3-4 tasks):
   - Implement LocalDatabase service with lowdb
   - Create database schemas and migration system
   - Implement CRUD operations for all entities
   - Add backup/restore functionality

   **Core Tools** (12 tasks) [P for independent tools]:
   - Implement codeParseTool (ts-morph AST parsing)
   - Implement codeScaffoldTool (code generation)
   - Implement astQueryTool (AST queries)
   - Implement patternMatcherTool (refactoring)
   - Implement commentInserterTool (documentation)
   - Implement testGenTool (test generation)
   - Implement testExecutorTool (Jest runner)
   - Implement complexityCalculator (metrics)
   - Implement promptParserTool (NL parsing)
   - Implement githubMcpTool (GitHub API)
   - Implement sonarqubeMcpTool (SonarQube API)
   - Add tool fallback/caching logic

   **Services** (8 tasks):
   - Implement ProjectContextService (onboarding)
   - Implement EmbeddingService (@xenova/transformers)
   - Implement VectorMemoryManager (ADK-TS integration)
   - Implement CodeFormatterService (Prettier wrapper)
   - Implement DiffGeneratorService (jsdiff)
   - Implement ValidationService (Zod validators)
   - Add error handling and logging
   - Add telemetry with OpenTelemetry

   **AI Agents** (10 tasks) [P for agent definitions]:
   - Implement LeadEngineerAgent (orchestrator)
   - Implement SpecInterpreterAgent
   - Implement CodeGeneratorAgent
   - Implement BugHunterAgent
   - Implement SecuritySentinelAgent
   - Implement PerformanceProfilerAgent
   - Implement TestCrafterAgent
   - Implement DocWeaverAgent
   - Implement DebateMediator resolver

   **Workflows** (4 tasks):
   - Implement CodeForgeWorkflow (hierarchical)
   - Implement GenerateWorkflow (generation pipeline)
   - Implement ReviewWorkflow (review pipeline)
   - Implement EnhanceWorkflow (enhancement pipeline)

   **API Endpoints** (8 tasks):
   - Implement POST /onboard with progress streaming
   - Implement POST /generate with WebSocket
   - Implement POST /review
   - Implement POST /enhance
   - Implement GET /status
   - Add Express middleware (auth, validation, rate limit, errors)
   - Setup Socket.io for streaming
   - Create server.ts entry point

   **CLI Commands** (5 tasks):
   - Implement onboard command
   - Implement generate command with flags
   - Implement review command
   - Implement enhance command
   - Implement config command
   - Create CLI index with Commander.js

   **Frontend UI** (8 tasks) [P for independent pages]:
   - Setup Vite + React + TypeScript
   - Implement CodeEditor component (Monaco)
   - Implement DiffViewer component
   - Implement AgentChat component (streaming)
   - Create GeneratePage
   - Create ReviewPage
   - Create HistoryPage
   - Setup WebSocket client and state management (Zustand)

   **VS Code Extension** (4 tasks):
   - Create extension manifest (package.json)
   - Implement generateFromSelection command
   - Implement reviewCurrentFile command
   - Implement CodeActionProvider
   - Setup extension build with esbuild

   **Testing** (15-20 tasks) [P for independent test files]:
   - Contract test: POST /onboard
   - Contract test: POST /generate
   - Contract test: POST /review
   - Contract test: POST /enhance
   - Integration test: Onboarding workflow
   - Integration test: Generation workflow
   - Integration test: Review workflow
   - Integration test: Enhancement workflow
   - Integration test: CLI commands
   - Integration test: Web UI flows
   - Unit tests: Agent logic (8 agents)
   - Unit tests: Tools (11 tools)
   - Unit tests: Services (6 services)
   - Performance benchmarks (<10s, <30s)
   - Load testing (API endpoints)

   **Documentation & Polish** (5-8 tasks):
   - Write comprehensive README
   - Create demo GIF/video
   - Write API documentation
   - Write agent architecture docs
   - Write deployment guide
   - Add inline TSDoc comments
   - Create ADR (Architecture Decision Records)
   - Final code formatting pass

3. **Task Ordering Rules**:
   - **Phase 3.1**: Setup (sequential, foundational)
   - **Phase 3.2**: Tests First (ALL tests written [P], MUST FAIL)
   - **Phase 3.3**: Models & Storage (sequential for schema, then [P] for models)
   - **Phase 3.4**: Tools & Services ([P] within category)
   - **Phase 3.5**: Agents & Workflows (agents [P], workflows sequential)
   - **Phase 3.6**: API & CLI (endpoints [P], integration sequential)
   - **Phase 3.7**: Frontend & Extension ([P] components)
   - **Phase 3.8**: Integration Testing (after implementation)
   - **Phase 3.9**: Documentation & Polish ([P])

4. **Parallel Execution Markers** [P]:
   - Same category, different files = [P]
   - No shared state between tasks = [P]
   - Independent agents/tools/models = [P]
   - Sequential dependencies = NO [P]

5. **Estimated Task Count**: 
   - Setup: 8-10
   - Models: 8
   - Storage: 3-4
   - Tools: 12
   - Services: 8
   - Agents: 10
   - Workflows: 4
   - API: 8
   - CLI: 5
   - Frontend: 8
   - Extension: 4
   - Testing: 15-20
   - Docs: 5-8
   - **Total: 98-110 tasks**

**IMPORTANT**: This phase is executed by the `/tasks` command, NOT by `/plan`. The above is the **strategy** that /tasks will follow.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅ (All 4 principles satisfied)
- [x] Post-Design Constitution Check: PASS ✅ (No violations introduced)
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅ (None - no violations)

**Artifacts Generated**:
- ✅ `plan.md` - This file (complete implementation plan)
- ✅ `research.md` - 10 technology decisions with rationale
- ✅ `data-model.md` - 8 entities with validation and persistence
- ✅ `contracts/onboard.md` - POST /onboard API contract
- ✅ `contracts/generate.md` - POST /generate API contract
- ✅ `contracts/review.md` - POST /review API contract
- ✅ `contracts/enhance.md` - POST /enhance API contract
- ✅ `quickstart.md` - 7 test scenarios with benchmarks
- ✅ `tasks.md` - 147 numbered tasks ready for execution

**Ready for**: Implementation! Start with Phase 3.1 (Setup tasks T001-T015)

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
