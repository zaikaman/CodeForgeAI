# Tasks: CodeForge AI - Multi-Agent System

**Input**: Design documents from `/specs/001-codeforge-ai-multi-agent/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

---

## Path Conventions

This is a **monorepo web application** with the following structure:

- `backend/src/` - Express API, CLI, agents, services
- `frontend/src/` - React SPA with Vite
- `vscode-extension/src/` - VS Code extension
- `shared/src/` - Shared TypeScript types
- `adk-ts/` - Local ADK-TS clone (already present)

---

## Phase 3.1: Setup & Configuration

- [x] **T001** Initialize monorepo with npm workspaces in package.json (root, backend, frontend, vscode-extension, shared)
- [x] **T002** Configure TypeScript for backend in `backend/tsconfig.json` (extends base, paths for @iqai/adk from ../../adk-ts)
- [x] **T003** Configure TypeScript for frontend in `frontend/tsconfig.json` (React JSX support)
- [x] **T004** Configure TypeScript for VS Code extension in `vscode-extension/tsconfig.json`
- [x] **T005** Configure TypeScript for shared types in `shared/tsconfig.json`
- [x] **T006** Setup ESLint with TypeScript parser in `.eslintrc.js` (root config)
- [x] **T007** Setup Prettier in `.prettierrc` (single quotes, no semicolons, 2 spaces)
- [x] **T008** Setup Husky pre-commit hooks in `.husky/pre-commit` (lint-staged with ESLint + Prettier)
- [x] **T009** Configure Jest for backend in `backend/jest.config.js` (TypeScript support, coverage thresholds 80%)
- [x] **T010** Configure Vitest for frontend in `frontend/vitest.config.ts` (React testing library)
- [x] **T011** Create `.env.example` in root with OPENAI_API_KEY, PORT, NODE_ENV, LOG_LEVEL
- [x] **T012** Create environment validation utility in `backend/src/utils/config.ts` (validate required env vars on startup)
- [x] **T013** Setup Vercel deployment configuration in `vercel.json` (serverless functions + static hosting)
- [x] **T014** Configure CI workflow in `.github/workflows/ci.yml` (lint, test, build on pull request)
- [x] **T015** Configure deployment workflow in `.github/workflows/deploy.yml` (Vercel deploy on main branch)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)

- [ ] **T016** [P] Contract test POST /api/onboard in `backend/tests/contract/onboard.test.ts` (201 response, projectId returned, embeddings count > 0)
- [ ] **T017** [P] Contract test POST /api/generate in `backend/tests/contract/generate.test.ts` (200 response, code field present, validation object)
- [ ] **T018** [P] Contract test POST /api/review in `backend/tests/contract/review.test.ts` (200 response, findings array, severity levels)
- [ ] **T019** [P] Contract test POST /api/enhance in `backend/tests/contract/enhance.test.ts` (200 response, diff chunks, impact analysis)
- [ ] **T020** [P] Contract test GET /api/status in `backend/tests/contract/status.test.ts` (200 response, health check data)

### Integration Tests (User Workflows)

- [ ] **T021** [P] Integration test onboarding workflow in `backend/tests/integration/onboard-workflow.test.ts` (scan repo → embeddings → save context)
- [ ] **T022** [P] Integration test generation workflow in `backend/tests/integration/generate-workflow.test.ts` (prompt → agents → code → tests → review)
- [ ] **T023** [P] Integration test review workflow in `backend/tests/integration/review-workflow.test.ts` (code input → multi-agent analysis → findings)
- [ ] **T024** [P] Integration test enhancement workflow in `backend/tests/integration/enhance-workflow.test.ts` (code → proposals → diffs)
- [ ] **T025** [P] Integration test CLI onboard command in `backend/tests/integration/cli-onboard.test.ts` (command execution → output format)
- [ ] **T026** [P] Integration test CLI generate command in `backend/tests/integration/cli-generate.test.ts` (command with flags → file creation)
- [ ] **T027** [P] Integration test Web UI generation flow in `frontend/tests/integration/generation-flow.test.ts` (form submit → WebSocket → results display)

### Performance Tests

- [ ] **T028** [P] Performance test onboarding <10s for 100 files in `backend/tests/performance/onboard-perf.test.ts`
- [ ] **T029** [P] Performance test generation <30s for complex request in `backend/tests/performance/generate-perf.test.ts`
- [ ] **T030** [P] Performance test API p95 latency <200ms in `backend/tests/performance/api-latency.test.ts`

---

## Phase 3.3: Data Models (ONLY after tests are failing)

- [ ] **T031** [P] Create ProjectContext model in `backend/src/models/ProjectContext.ts` (interface + Zod schema with validation rules)
- [ ] **T032** [P] Create Agent model in `backend/src/models/Agent.ts` (interface + AgentType enum + Tool interface)
- [ ] **T033** [P] Create GenerationRequest model in `backend/src/models/GenerationRequest.ts` (interface + Zod validation)
- [ ] **T034** [P] Create CodeOutput model in `backend/src/models/CodeOutput.ts` (interface + validation + confidence)
- [ ] **T035** [P] Create ReviewReport model in `backend/src/models/ReviewReport.ts` (interface + findings + severity)
- [ ] **T036** [P] Create EnhancementProposal model in `backend/src/models/EnhancementProposal.ts` (interface + diff chunks)
- [ ] **T037** [P] Create ToolIntegration model in `backend/src/models/ToolIntegration.ts` (GitHub/SonarQube config)
- [ ] **T038** [P] Create GenerationHistory model in `backend/src/models/GenerationHistory.ts` (entries + metadata)
- [ ] **T039** [P] Export all models from `backend/src/models/index.ts`

---

## Phase 3.4: Storage Layer

- [ ] **T040** Implement LocalDatabase service in `backend/src/storage/LocalDatabase.ts` (lowdb wrapper with CRUD operations)
- [ ] **T041** Create database schemas in `backend/src/storage/schemas/contextSchema.ts` (projects, agents, history collections)
- [ ] **T042** Implement database migrations in `backend/src/storage/migrations/` (versioning + schema updates)
- [ ] **T043** Add database backup/restore in `backend/src/storage/LocalDatabase.ts` (export/import JSON)

---

## Phase 3.5: Core Tools (Agent Capabilities)

### Code Manipulation Tools

- [ ] **T044** [P] Implement codeParseTool in `backend/src/tools/code/codeParseTool.ts` (ts-morph AST parsing, extract functions/classes)
- [ ] **T045** [P] Implement codeScaffoldTool in `backend/src/tools/code/codeScaffoldTool.ts` (generate boilerplate from template)
- [ ] **T046** [P] Implement astQueryTool in `backend/src/tools/code/astQueryTool.ts` (query AST for symbols, imports, exports)
- [ ] **T047** [P] Implement patternMatcherTool in `backend/src/tools/code/patternMatcherTool.ts` (find code patterns for refactoring)
- [ ] **T048** [P] Implement commentInserterTool in `backend/src/tools/code/commentInserterTool.ts` (add TSDoc comments)

### Testing Tools

- [ ] **T049** [P] Implement testGenTool in `backend/src/tools/testing/testGenTool.ts` (generate Jest tests from function signature)
- [ ] **T050** [P] Implement testExecutorTool in `backend/src/tools/testing/testExecutorTool.ts` (run Jest programmatically, return results)

### Analysis Tools

- [ ] **T051** [P] Implement complexityCalculator in `backend/src/tools/analysis/complexityCalculator.ts` (cyclomatic complexity via ts-morph)
- [ ] **T052** [P] Implement promptParserTool in `backend/src/tools/analysis/promptParserTool.ts` (extract intent, entities from NL)

### Integration Tools

- [ ] **T053** [P] Implement githubMcpTool in `backend/src/tools/integrations/githubMcpTool.ts` (Octokit wrapper, repo info, PR creation)
- [ ] **T054** [P] Implement sonarqubeMcpTool in `backend/src/tools/integrations/sonarqubeMcpTool.ts` (SonarQube API, code quality metrics)

- [ ] **T055** Add tool registry in `backend/src/tools/index.ts` (export all tools, tool discovery)

---

## Phase 3.6: Services (Business Logic)

- [ ] **T056** Implement ProjectContextService in `backend/src/services/ProjectContextService.ts` (onboard repo, scan files, build file structure)
- [ ] **T057** Implement EmbeddingService in `backend/src/services/EmbeddingService.ts` (@xenova/transformers integration, all-MiniLM-L6-v2 model)
- [ ] **T058** Implement VectorMemoryManager in `backend/src/services/VectorMemoryManager.ts` (ADK-TS VectorMemoryService wrapper, store/query embeddings)
- [ ] **T059** Implement CodeFormatterService in `backend/src/services/CodeFormatterService.ts` (Prettier wrapper, format code)
- [ ] **T060** Implement DiffGeneratorService in `backend/src/services/DiffGeneratorService.ts` (jsdiff integration, generate diffs)
- [ ] **T061** Implement ValidationService in `backend/src/services/ValidationService.ts` (Zod validators, syntax checking)
- [ ] **T062** Add error handling to all services (try/catch, structured errors)
- [ ] **T063** Add logging to all services in `backend/src/utils/logger.ts` (winston or pino, structured logs)
- [ ] **T064** Setup telemetry in `backend/src/utils/telemetry.ts` (OpenTelemetry, trace agent calls)

---

## Phase 3.7: AI Agents (ADK-TS Integration)

### Agent Implementations

- [ ] **T065** [P] Implement LeadEngineerAgent in `backend/src/agents/base/LeadEngineerAgent.ts` (orchestrator, AgentBuilder.withModel('gpt-5-nano'), system prompt)
- [ ] **T066** [P] Implement SpecInterpreterAgent in `backend/src/agents/specialized/SpecInterpreterAgent.ts` (parse NL specs, extract requirements)
- [ ] **T067** [P] Implement CodeGeneratorAgent in `backend/src/agents/specialized/CodeGeneratorAgent.ts` (generate code from requirements, use codeParseTool)
- [ ] **T068** [P] Implement BugHunterAgent in `backend/src/agents/specialized/BugHunterAgent.ts` (find bugs, security issues)
- [ ] **T069** [P] Implement RefactorGuruAgent in `backend/src/agents/specialized/RefactorGuruAgent.ts` (suggest refactorings, use patternMatcherTool)
- [ ] **T070** [P] Implement SecuritySentinelAgent in `backend/src/agents/specialized/SecuritySentinelAgent.ts` (security analysis, vulnerability detection)
- [ ] **T071** [P] Implement PerformanceProfilerAgent in `backend/src/agents/specialized/PerformanceProfilerAgent.ts` (performance analysis, optimization suggestions)
- [ ] **T072** [P] Implement TestCrafterAgent in `backend/src/agents/specialized/TestCrafterAgent.ts` (generate tests, use testGenTool)
- [ ] **T073** [P] Implement DocWeaverAgent in `backend/src/agents/specialized/DocWeaverAgent.ts` (generate documentation, use commentInserterTool)

### Agent Infrastructure

- [ ] **T074** Implement DebateMediator in `backend/src/agents/resolvers/DebateMediator.ts` (resolve agent disagreements, voting mechanism)
- [ ] **T075** Implement AgentFactory in `backend/src/agents/base/AgentFactory.ts` (create agents with config, register tools)

---

## Phase 3.8: Workflows (ADK-TS Orchestration)

- [ ] **T076** Implement CodeForgeWorkflow in `backend/src/workflows/CodeForgeWorkflow.ts` (hierarchical workflow, LeadAgent → specialized agents)
- [ ] **T077** Implement GenerateWorkflow in `backend/src/workflows/GenerateWorkflow.ts` (SpecInterpreter → CodeGenerator → TestCrafter → review)
- [ ] **T078** Implement ReviewWorkflow in `backend/src/workflows/ReviewWorkflow.ts` (parallel agent review → DebateMediator → consensus)
- [ ] **T079** Implement EnhanceWorkflow in `backend/src/workflows/EnhanceWorkflow.ts` (RefactorGuru → SecuritySentinel → PerformanceProfiler)

---

## Phase 3.9: API Endpoints (Express Backend)

### Middleware

- [ ] **T080** Implement auth middleware in `backend/src/api/middleware/auth.ts` (optional Bearer token validation)
- [ ] **T081** Implement validation middleware in `backend/src/api/middleware/validation.ts` (Zod schema validation)
- [ ] **T082** Implement error handler middleware in `backend/src/api/middleware/errorHandler.ts` (catch errors, format responses)
- [ ] **T083** Implement rate limiter in `backend/src/api/middleware/rateLimiter.ts` (express-rate-limit)

### Routes

- [ ] **T084** Implement POST /api/onboard in `backend/src/api/routes/onboard.ts` (ProjectContextService, progress WebSocket, save to DB)
- [ ] **T085** Implement POST /api/generate in `backend/src/api/routes/generate.ts` (GenerateWorkflow, streaming response, save history)
- [ ] **T086** Implement POST /api/review in `backend/src/api/routes/review.ts` (ReviewWorkflow, return findings)
- [ ] **T087** Implement POST /api/enhance in `backend/src/api/routes/enhance.ts` (EnhanceWorkflow, generate diffs)
- [ ] **T088** Implement GET /api/status in `backend/src/api/routes/status.ts` (health check, agent status)

### Server Setup

- [ ] **T089** Setup Socket.io in `backend/src/api/server.ts` (WebSocket server for streaming)
- [ ] **T090** Create Express app in `backend/src/api/server.ts` (CORS, JSON parser, routes, middleware, error handler)
- [ ] **T091** Add server startup script in `backend/src/index.ts` (load env, connect DB, start server)

---

## Phase 3.10: CLI Commands (Commander.js)

- [ ] **T092** Implement onboard command in `backend/src/cli/commands/onboard.ts` (call API, display progress, save projectId)
- [ ] **T093** Implement generate command in `backend/src/cli/commands/generate.ts` (parse flags, call API, save output to file)
- [ ] **T094** Implement review command in `backend/src/cli/commands/review.ts` (read file, call API, display findings)
- [ ] **T095** Implement enhance command in `backend/src/cli/commands/enhance.ts` (read file, call API, apply diffs)
- [ ] **T096** Implement config command in `backend/src/cli/commands/config.ts` (set API key, configure options)
- [ ] **T097** Create CLI entry point in `backend/src/cli/index.ts` (Commander setup, register commands, version, help)

---

## Phase 3.11: Frontend UI (React + Vite)

### Components

- [ ] **T098** [P] Implement CodeEditor component in `frontend/src/components/CodeEditor.tsx` (Monaco editor wrapper, syntax highlighting)
- [ ] **T099** [P] Implement DiffViewer component in `frontend/src/components/DiffViewer.tsx` (react-diff-viewer, side-by-side)
- [ ] **T100** [P] Implement AgentChat component in `frontend/src/components/AgentChat.tsx` (streaming agent thoughts, WebSocket)
- [ ] **T101** [P] Implement GenerationForm component in `frontend/src/components/GenerationForm.tsx` (prompt input, options, submit)
- [ ] **T102** [P] Implement ReviewPanel component in `frontend/src/components/ReviewPanel.tsx` (findings list, severity badges)
- [ ] **T103** [P] Implement StatusIndicator component in `frontend/src/components/StatusIndicator.tsx` (loading, success, error states)

### Pages

- [ ] **T104** [P] Create HomePage in `frontend/src/pages/HomePage.tsx` (landing page, features, get started button)
- [ ] **T105** [P] Create GeneratePage in `frontend/src/pages/GeneratePage.tsx` (GenerationForm + CodeEditor + AgentChat)
- [ ] **T106** [P] Create ReviewPage in `frontend/src/pages/ReviewPage.tsx` (file upload + ReviewPanel)
- [ ] **T107** [P] Create HistoryPage in `frontend/src/pages/HistoryPage.tsx` (list past generations, details)

### Services & State

- [ ] **T108** Implement API client in `frontend/src/services/apiClient.ts` (Axios wrapper, error handling)
- [ ] **T109** Implement WebSocket client in `frontend/src/services/websocketClient.ts` (Socket.io client, reconnection)
- [ ] **T110** [P] Create useGeneration hook in `frontend/src/hooks/useGeneration.ts` (call generate API, manage state)
- [ ] **T111** [P] Create useReview hook in `frontend/src/hooks/useReview.ts` (call review API)
- [ ] **T112** [P] Create useWebSocket hook in `frontend/src/hooks/useWebSocket.ts` (WebSocket connection, messages)
- [ ] **T113** Setup Zustand store in `frontend/src/stores/generationStore.ts` (generation state, history)
- [ ] **T114** Setup UI store in `frontend/src/stores/uiStore.ts` (loading, errors, modals)
- [ ] **T115** Create App component in `frontend/src/App.tsx` (router, layout, pages)

---

## Phase 3.12: VS Code Extension

- [ ] **T116** Create extension manifest in `vscode-extension/package.json` (activationEvents, contributes.commands)
- [ ] **T117** Implement extension activation in `vscode-extension/src/extension.ts` (register commands, status bar)
- [ ] **T118** Implement generateFromSelection command in `vscode-extension/src/commands/generateFromSelection.ts` (get selection, call API, insert)
- [ ] **T119** Implement reviewCurrentFile command in `vscode-extension/src/commands/reviewCurrentFile.ts` (read file, call API, show diagnostics)
- [ ] **T120** Implement enhanceSelection command in `vscode-extension/src/commands/enhanceSelection.ts` (get selection, call API, apply diff)
- [ ] **T121** Implement CodeActionProvider in `vscode-extension/src/providers/CodeActionProvider.ts` (quick fixes from review)
- [ ] **T122** Create API client for extension in `vscode-extension/src/utils/apiClient.ts` (call localhost backend)

---

## Phase 3.13: Shared Package

- [ ] **T123** [P] Export shared types in `shared/src/types/Agent.ts` (Agent, AgentType)
- [ ] **T124** [P] Export shared types in `shared/src/types/Request.ts` (GenerationRequest, ReviewRequest)
- [ ] **T125** [P] Export shared types in `shared/src/types/Response.ts` (CodeOutput, ReviewReport)
- [ ] **T126** [P] Export shared types in `shared/src/types/Config.ts` (env vars, options)
- [ ] **T127** [P] Export shared constants in `shared/src/constants/prompts.ts` (agent system prompts)
- [ ] **T128** Create shared index in `shared/src/index.ts` (re-export all)

---

## Phase 3.14: Integration Testing (After Implementation)

- [ ] **T129** Run integration test suite (verify T021-T027 pass)
- [ ] **T130** Run performance test suite (verify T028-T030 meet benchmarks)
- [ ] **T131** Run contract test suite (verify T016-T020 pass)
- [ ] **T132** Manual testing of CLI commands (onboard, generate, review, enhance)
- [ ] **T133** Manual testing of Web UI (all pages, WebSocket streaming)
- [ ] **T134** Manual testing of VS Code extension (all commands)
- [ ] **T135** Execute quickstart.md scenarios (verify all 7 scenarios pass)

---

## Phase 3.15: Documentation & Polish

- [ ] **T136** [P] Write comprehensive README in `README.md` (features, installation, usage, examples)
- [ ] **T137** [P] Create demo GIF/video in `docs/demo.gif` (show CLI + Web UI workflows)
- [ ] **T138** [P] Write API documentation in `docs/api.md` (all endpoints, request/response examples)
- [ ] **T139** [P] Write agent architecture docs in `docs/agent-architecture.md` (diagram, agent roles, workflows)
- [ ] **T140** [P] Write deployment guide in `docs/deployment.md` (Vercel setup, env vars, troubleshooting)
- [ ] **T141** [P] Add TSDoc comments to all public APIs (agents, services, tools)
- [ ] **T142** [P] Create Architecture Decision Records in `docs/adr/` (ADR template, 5+ decisions)
- [ ] **T143** Run final code formatting pass (Prettier on all files)
- [ ] **T144** Remove code duplication (DRY principle, extract common logic)
- [ ] **T145** Verify ESLint passes with no warnings
- [ ] **T146** Verify test coverage meets 80% threshold
- [ ] **T147** Update CHANGELOG.md with v1.0.0 release notes

---

## Dependencies

**Critical Path**:

1. Setup (T001-T015) → Everything
2. Tests (T016-T030) → Implementation (T031+)
3. Models (T031-T039) → Services (T056-T064)
4. Storage (T040-T043) → Services (T056-T064)
5. Tools (T044-T055) → Agents (T065-T075)
6. Services (T056-T064) → Workflows (T076-T079), API (T084-T088)
7. Agents (T065-T075) → Workflows (T076-T079)
8. Workflows (T076-T079) → API (T084-T088), CLI (T092-T097)
9. API (T084-T091) → Frontend (T098-T115), VS Code Extension (T116-T122)
10. Implementation (T031-T128) → Integration Tests (T129-T135)
11. Everything → Documentation (T136-T147)

**Parallel Opportunities**:

- All Phase 3.2 tests can run in parallel [P]
- All Phase 3.3 models can be created in parallel [P]
- All Phase 3.5 tools can be implemented in parallel [P]
- All Phase 3.7 agent implementations can be done in parallel [P]
- All Phase 3.11 components/pages can be built in parallel [P]
- All Phase 3.15 documentation tasks can be done in parallel [P]

---

## Parallel Execution Examples

### Launch all contract tests (Phase 3.2):

```bash
# Task T016: Contract test POST /api/onboard
# Task T017: Contract test POST /api/generate
# Task T018: Contract test POST /api/review
# Task T019: Contract test POST /api/enhance
# Task T020: Contract test GET /api/status
```

### Launch all model creation (Phase 3.3):

```bash
# Task T031: Create ProjectContext model
# Task T032: Create Agent model
# Task T033: Create GenerationRequest model
# Task T034: Create CodeOutput model
# Task T035: Create ReviewReport model
# Task T036: Create EnhancementProposal model
# Task T037: Create ToolIntegration model
# Task T038: Create GenerationHistory model
```

### Launch all agent implementations (Phase 3.7):

```bash
# Task T065: Implement LeadEngineerAgent
# Task T066: Implement SpecInterpreterAgent
# Task T067: Implement CodeGeneratorAgent
# Task T068: Implement BugHunterAgent
# Task T069: Implement RefactorGuruAgent
# Task T070: Implement SecuritySentinelAgent
# Task T071: Implement PerformanceProfilerAgent
# Task T072: Implement TestCrafterAgent
# Task T073: Implement DocWeaverAgent
```

---

## Validation Checklist

- [x] All 4 contracts have corresponding tests (T016-T019)
- [x] All 8 entities have model tasks (T031-T038)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Total task count: 147 tasks (within expected range)

---

## Notes

- **TDD Enforcement**: Phase 3.2 tests MUST fail before implementing Phase 3.3+
- **Parallel Execution**: Tasks marked [P] can run simultaneously (different files, no dependencies)
- **Commit Strategy**: Commit after each task completion
- **Local ADK-TS**: Import from `../../adk-ts/src` (already cloned and built)
- **Model**: Use `AgentBuilder.withModel('gpt-5-nano')` for all agents
- **Environment**: Set `OPENAI_API_KEY` before running any tasks
- **Testing**: Run tests frequently to catch regressions early
- **Code Quality**: ESLint + Prettier on every commit via Husky

---

**Total Tasks**: 147  
**Estimated Duration**: 4-6 weeks (solo developer, full-time)  
**Critical Path**: Setup → Tests → Models → Tools → Agents → Workflows → API → UI → Integration → Docs

**Ready for execution!** 🚀
