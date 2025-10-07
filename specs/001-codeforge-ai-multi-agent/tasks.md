# Tasks: CodeForge AI - Multi-Agent System

**Input**: Design documents from `/specs/001-codeforge-ai-multi-agent/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

---

## Path Conventions

This is a **web-first monorepo application** with the following structure:

- `backend/src/` - Express API (Vercel serverless functions), agents, services
- `frontend/src/` - React SPA with Vite
- `shared/src/` - Shared TypeScript types
- `cli/src/` - CLI tool (optional, Phase 3.14 bonus feature)
- `adk-ts/` - Local ADK-TS clone (already present)

**Architecture**:

- **Frontend**: React + Vite (static hosting on Vercel)
- **Backend**: Express API (Vercel serverless functions)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Storage**: Supabase Storage (for project files, embeddings)
- **Deployment**: Vercel (frontend + backend)
- **CLI**: Optional Commander.js tool (calls web API, comes after web app is complete)

---

## Phase 3.1: Setup & Configuration

- [x] **T001** Initialize monorepo with npm workspaces in package.json (root, backend, frontend, shared)
- [x] **T002** Configure TypeScript for backend in `backend/tsconfig.json` (extends base, paths for @iqai/adk from ../../adk-ts)
- [x] **T003** Configure TypeScript for frontend in `frontend/tsconfig.json` (React JSX support)
- [x] **T004** Configure TypeScript for shared types in `shared/tsconfig.json`
- [x] **T005** Setup ESLint with TypeScript parser in `.eslintrc.js` (root config)
- [x] **T006** Setup Prettier in `.prettierrc` (single quotes, no semicolons, 2 spaces)
- [x] **T007** Setup Husky pre-commit hooks in `.husky/pre-commit` (lint-staged with ESLint + Prettier)
- [x] **T008** Configure Jest for backend in `backend/jest.config.js` (TypeScript support, coverage thresholds 80%)
- [x] **T009** Configure Vitest for frontend in `frontend/vitest.config.ts` (React testing library)
- [x] **T010** Create `.env.example` in root with OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
- [x] **T011** Create environment validation utility in `backend/src/utils/config.ts` (validate required env vars on startup)
- [x] **T012** Setup Vercel deployment configuration in `vercel.json` (serverless functions + static hosting)
- [x] **T013** Configure CI workflow in `.github/workflows/ci.yml` (lint, test, build on pull request)
- [x] **T014** Configure deployment workflow in `.github/workflows/deploy.yml` (Vercel deploy on main branch)
- [x] **T015** Install Supabase client in `@supabase/supabase-js` for backend and frontend

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)

- [x] **T016** [P] Contract test POST /api/onboard in `backend/tests/contract/onboard.test.ts` (201 response, projectId returned, embeddings count > 0)
- [x] **T017** [P] Contract test POST /api/generate in `backend/tests/contract/generate.test.ts` (200 response, code field present, validation object)
- [x] **T018** [P] Contract test POST /api/review in `backend/tests/contract/review.test.ts` (200 response, findings array, severity levels)
- [x] **T019** [P] Contract test POST /api/enhance in `backend/tests/contract/enhance.test.ts` (200 response, diff chunks, impact analysis)
- [x] **T020** [P] Contract test GET /api/status in `backend/tests/contract/status.test.ts` (200 response, health check data)

### Integration Tests (User Workflows)

- [x] **T021** [P] Integration test onboarding workflow in `backend/tests/integration/onboard-workflow.test.ts` (scan repo → embeddings → save to Supabase)
- [x] **T022** [P] Integration test generation workflow in `backend/tests/integration/generate-workflow.test.ts` (prompt → agents → code → tests → review)
- [x] **T023** [P] Integration test review workflow in `backend/tests/integration/review-workflow.test.ts` (code input → multi-agent analysis → findings)
- [x] **T024** [P] Integration test enhancement workflow in `backend/tests/integration/enhance-workflow.test.ts` (code → proposals → diffs)
- [x] **T025** [P] Integration test Web UI generation flow in `frontend/tests/integration/generation-flow.test.ts` (form submit → WebSocket → results display)

### Performance Tests

- [x] **T026** [P] Performance test onboarding <10s for 100 files in `backend/tests/performance/onboard-perf.test.ts`
- [x] **T027** [P] Performance test generation <30s for complex request in `backend/tests/performance/generate-perf.test.ts`
- [x] **T028** [P] Performance test API p95 latency <200ms in `backend/tests/performance/api-latency.test.ts`

---

## Phase 3.3: Data Models (ONLY after tests are failing)

- [x] **T029** [P] Create ProjectContext model in `backend/src/models/ProjectContext.ts` (interface + Zod schema with validation rules)
- [x] **T030** [P] Create Agent model in `backend/src/models/Agent.ts` (interface + AgentType enum + Tool interface)
- [x] **T031** [P] Create GenerationRequest model in `backend/src/models/GenerationRequest.ts` (interface + Zod validation)
- [x] **T032** [P] Create CodeOutput model in `backend/src/models/CodeOutput.ts` (interface + validation + confidence)
- [x] **T033** [P] Create ReviewReport model in `backend/src/models/ReviewReport.ts` (interface + findings + severity)
- [x] **T034** [P] Create EnhancementProposal model in `backend/src/models/EnhancementProposal.ts` (interface + diff chunks)
- [x] **T035** [P] Create ToolIntegration model in `backend/src/models/ToolIntegration.ts` (GitHub/SonarQube config)
- [x] **T036** [P] Create GenerationHistory model in `backend/src/models/GenerationHistory.ts` (entries + metadata)
- [x] **T037** [P] Export all models from `backend/src/models/index.ts`

---

## Phase 3.4: Supabase Setup & Integration

### Database Setup

- [x] **T038** Create Supabase project and get credentials (URL, anon key, service key)
- [x] **T039** Create database schema in `supabase/migrations/001_initial_schema.sql` (projects, agents, generation_history, embeddings tables)
- [x] **T040** Setup Row Level Security (RLS) policies in `supabase/migrations/002_rls_policies.sql` (user isolation, read/write rules)
- [x] **T041** Create Supabase storage buckets in `supabase/migrations/003_storage_buckets.sql` (project-files, embeddings)

### Authentication

- [x] **T042** Setup Supabase Auth config (email/password, OAuth providers)
- [x] **T043** Create user profiles table in `supabase/migrations/004_user_profiles.sql` (extended user data)
- [x] **T044** Implement auth middleware in `backend/src/api/middleware/supabaseAuth.ts` (JWT validation)

### Backend Client

- [x] **T045** Implement SupabaseClient in `backend/src/storage/SupabaseClient.ts` (service role client, CRUD operations)
- [x] **T046** Implement ProjectRepository in `backend/src/storage/repositories/ProjectRepository.ts` (CRUD for projects table)
- [x] **T047** Implement GenerationHistoryRepository in `backend/src/storage/repositories/GenerationHistoryRepository.ts` (CRUD for history)
- [x] **T048** Implement EmbeddingRepository in `backend/src/storage/repositories/EmbeddingRepository.ts` (store/query vector embeddings)
- [x] **T049** Create repository index in `backend/src/storage/repositories/index.ts` (export all repositories)

### Frontend Client

- [x] **T050** Implement Supabase client in `frontend/src/lib/supabase.ts` (browser client with auth)
- [x] **T051** Create auth context in `frontend/src/contexts/AuthContext.tsx` (login, logout, user state)
- [x] **T052** Implement useAuth hook in `frontend/src/hooks/useAuth.ts` (access auth context)
- [x] **T053** Create protected route wrapper in `frontend/src/components/ProtectedRoute.tsx` (require auth)

---

## Phase 3.5: Core Tools (Agent Capabilities)

### Code Manipulation Tools

- [x] **T054** [P] Implement codeParseTool in `backend/src/tools/code/codeParseTool.ts` (ts-morph AST parsing, extract functions/classes)
- [x] **T055** [P] Implement codeScaffoldTool in `backend/src/tools/code/codeScaffoldTool.ts` (generate boilerplate from template)
- [x] **T056** [P] Implement astQueryTool in `backend/src/tools/code/astQueryTool.ts` (query AST for symbols, imports, exports)
- [x] **T057** [P] Implement patternMatcherTool in `backend/src/tools/code/patternMatcherTool.ts` (find code patterns for refactoring)
- [x] **T058** [P] Implement commentInserterTool in `backend/src/tools/code/commentInserterTool.ts` (add TSDoc comments)

### Testing Tools

- [x] **T059** [P] Implement testGenTool in `backend/src/tools/testing/testGenTool.ts` (generate Jest tests from function signature)
- [x] **T060** [P] Implement testExecutorTool in `backend/src/tools/testing/testExecutorTool.ts` (run Jest programmatically, return results)

### Analysis Tools

- [x] **T061** [P] Implement complexityCalculator in `backend/src/tools/analysis/complexityCalculator.ts` (cyclomatic complexity via ts-morph)
- [x] **T062** [P] Implement promptParserTool in `backend/src/tools/analysis/promptParserTool.ts` (extract intent, entities from NL)

### Integration Tools

- [x] **T063** [P] Implement githubMcpTool in `backend/src/tools/integrations/githubMcpTool.ts` (Octokit wrapper, repo info, PR creation)
- [x] **T064** [P] Implement sonarqubeMcpTool in `backend/src/tools/integrations/sonarqubeMcpTool.ts` (SonarQube API, code quality metrics)

- [x] **T065** Add tool registry in `backend/src/tools/index.ts` (export all tools, tool discovery)

---

## Phase 3.6: Services (Business Logic)

- [x] **T066** Implement ProjectContextService in `backend/src/services/ProjectContextService.ts` (onboard repo, scan files, build file structure)
- [x] **T067** Implement EmbeddingService in `backend/src/services/EmbeddingService.ts` (@xenova/transformers integration, all-MiniLM-L6-v2 model)
- [x] **T068** Implement VectorMemoryManager in `backend/src/services/VectorMemoryManager.ts` (ADK-TS VectorMemoryService wrapper, store/query embeddings with Supabase)
- [x] **T069** Implement CodeFormatterService in `backend/src/services/CodeFormatterService.ts` (Prettier wrapper, format code)
- [x] **T070** Implement DiffGeneratorService in `backend/src/services/DiffGeneratorService.ts` (jsdiff integration, generate diffs)
- [x] **T071** Implement ValidationService in `backend/src/services/ValidationService.ts` (Zod validators, syntax checking)
- [x] **T072** Add error handling to all services (try/catch, structured errors)
- [x] **T073** Add logging to all services in `backend/src/utils/logger.ts` (winston or pino, structured logs)
- [x] **T074** Setup telemetry in `backend/src/utils/telemetry.ts` (OpenTelemetry, trace agent calls)

---

## Phase 3.7: AI Agents (ADK-TS Integration)

### Agent Implementations

- [x] **T075** [P] Implement LeadEngineerAgent in `backend/src/agents/base/LeadEngineerAgent.ts` (orchestrator, AgentBuilder.withModel('gpt-5-nano'), system prompt)
- [x] **T076** [P] Implement SpecInterpreterAgent in `backend/src/agents/specialized/SpecInterpreterAgent.ts` (parse NL specs, extract requirements)
- [x] **T077** [P] Implement CodeGeneratorAgent in `backend/src/agents/specialized/CodeGeneratorAgent.ts` (generate code from requirements, use codeParseTool)
- [x] **T078** [P] Implement BugHunterAgent in `backend/src/agents/specialized/BugHunterAgent.ts` (find bugs, security issues)
- [x] **T079** [P] Implement RefactorGuruAgent in `backend/src/agents/specialized/RefactorGuruAgent.ts` (suggest refactorings, use patternMatcherTool)
- [x] **T080** [P] Implement SecuritySentinelAgent in `backend/src/agents/specialized/SecuritySentinelAgent.ts` (security analysis, vulnerability detection)
- [x] **T081** [P] Implement PerformanceProfilerAgent in `backend/src/agents/specialized/PerformanceProfilerAgent.ts` (performance analysis, optimization suggestions)
- [x] **T082** [P] Implement TestCrafterAgent in `backend/src/agents/specialized/TestCrafterAgent.ts` (generate tests, use testGenTool)
- [x] **T083** [P] Implement DocWeaverAgent in `backend/src/agents/specialized/DocWeaverAgent.ts` (generate documentation, use commentInserterTool)

### Agent Infrastructure

- [x] **T084** Implement DebateMediator in `backend/src/agents/resolvers/DebateMediator.ts` (resolve agent disagreements, voting mechanism)
- [x] **T085** Implement AgentFactory in `backend/src/agents/base/AgentFactory.ts` (create agents with config, register tools)

---

## Phase 3.8: Workflows (ADK-TS Orchestration)

- [x] **T086** Implement CodeForgeWorkflow in `backend/src/workflows/CodeForgeWorkflow.ts` (hierarchical workflow, LeadAgent → specialized agents)
- [x] **T087** Implement GenerateWorkflow in `backend/src/workflows/GenerateWorkflow.ts` (SpecInterpreter → CodeGenerator → TestCrafter → review)
- [x] **T088** Implement ReviewWorkflow in `backend/src/workflows/ReviewWorkflow.ts` (parallel agent review → DebateMediator → consensus)
- [x] **T089** Implement EnhanceWorkflow in `backend/src/workflows/EnhanceWorkflow.ts` (RefactorGuru → SecuritySentinel → PerformanceProfiler)

---

## Phase 3.9: API Endpoints (Express Backend)

### Middleware

- [ ] **T090** Implement auth middleware in `backend/src/api/middleware/auth.ts` (Supabase JWT validation)
- [ ] **T091** Implement validation middleware in `backend/src/api/middleware/validation.ts` (Zod schema validation)
- [ ] **T092** Implement error handler middleware in `backend/src/api/middleware/errorHandler.ts` (catch errors, format responses)
- [ ] **T093** Implement rate limiter in `backend/src/api/middleware/rateLimiter.ts` (express-rate-limit)

### Routes

- [ ] **T094** Implement POST /api/onboard in `backend/src/api/routes/onboard.ts` (ProjectContextService, progress WebSocket, save to Supabase)
- [ ] **T095** Implement POST /api/generate in `backend/src/api/routes/generate.ts` (GenerateWorkflow, streaming response, save history to Supabase)
- [ ] **T096** Implement POST /api/review in `backend/src/api/routes/review.ts` (ReviewWorkflow, return findings)
- [ ] **T097** Implement POST /api/enhance in `backend/src/api/routes/enhance.ts` (EnhanceWorkflow, generate diffs)
- [ ] **T098** Implement GET /api/status in `backend/src/api/routes/status.ts` (health check, agent status, Supabase connection)
- [ ] **T099** Implement GET /api/projects in `backend/src/api/routes/projects.ts` (list user projects from Supabase)
- [ ] **T100** Implement GET /api/history in `backend/src/api/routes/history.ts` (get generation history from Supabase)

### Server Setup

- [ ] **T101** Setup Socket.io in `backend/src/api/server.ts` (WebSocket server for streaming)
- [ ] **T102** Create Express app in `backend/src/api/server.ts` (CORS, JSON parser, routes, middleware, error handler)
- [ ] **T103** Add server startup script in `backend/src/index.ts` (load env, initialize Supabase client, start server)
- [ ] **T104** Configure Vercel serverless functions in `api/` directory (proxy to Express app)

---

## Phase 3.10: Frontend UI (React + Vite)

### Authentication

- [ ] **T105** [P] Create LoginPage in `frontend/src/pages/auth/LoginPage.tsx` (email/password, OAuth buttons)
- [ ] **T106** [P] Create SignupPage in `frontend/src/pages/auth/SignupPage.tsx` (email/password registration)
- [ ] **T107** [P] Create AuthCallback in `frontend/src/pages/auth/AuthCallback.tsx` (handle OAuth redirect)

### Components

- [ ] **T108** [P] Implement CodeEditor component in `frontend/src/components/CodeEditor.tsx` (Monaco editor wrapper, syntax highlighting)
- [ ] **T109** [P] Implement DiffViewer component in `frontend/src/components/DiffViewer.tsx` (react-diff-viewer, side-by-side)
- [ ] **T110** [P] Implement AgentChat component in `frontend/src/components/AgentChat.tsx` (streaming agent thoughts, WebSocket)
- [ ] **T111** [P] Implement GenerationForm component in `frontend/src/components/GenerationForm.tsx` (prompt input, options, submit)
- [ ] **T112** [P] Implement ReviewPanel component in `frontend/src/components/ReviewPanel.tsx` (findings list, severity badges)
- [ ] **T113** [P] Implement StatusIndicator component in `frontend/src/components/StatusIndicator.tsx` (loading, success, error states)
- [ ] **T114** [P] Implement ProjectList component in `frontend/src/components/ProjectList.tsx` (grid/list view, search, filter)

### Pages

- [ ] **T115** [P] Create HomePage in `frontend/src/pages/HomePage.tsx` (landing page, features, get started button)
- [ ] **T116** [P] Create DashboardPage in `frontend/src/pages/DashboardPage.tsx` (user projects, recent activity)
- [ ] **T117** [P] Create GeneratePage in `frontend/src/pages/GeneratePage.tsx` (GenerationForm + CodeEditor + AgentChat)
- [ ] **T118** [P] Create ReviewPage in `frontend/src/pages/ReviewPage.tsx` (file upload + ReviewPanel)
- [ ] **T119** [P] Create HistoryPage in `frontend/src/pages/HistoryPage.tsx` (list past generations, details)
- [ ] **T120** [P] Create SettingsPage in `frontend/src/pages/SettingsPage.tsx` (user preferences, API keys)

### Services & State

- [ ] **T121** Implement API client in `frontend/src/services/apiClient.ts` (Axios wrapper, error handling, auth headers)
- [ ] **T122** Implement WebSocket client in `frontend/src/services/websocketClient.ts` (Socket.io client, reconnection)
- [ ] **T123** [P] Create useGeneration hook in `frontend/src/hooks/useGeneration.ts` (call generate API, manage state)
- [ ] **T124** [P] Create useReview hook in `frontend/src/hooks/useReview.ts` (call review API)
- [ ] **T125** [P] Create useWebSocket hook in `frontend/src/hooks/useWebSocket.ts` (WebSocket connection, messages)
- [ ] **T126** [P] Create useProjects hook in `frontend/src/hooks/useProjects.ts` (fetch/create projects)
- [ ] **T127** Setup Zustand store in `frontend/src/stores/generationStore.ts` (generation state, history)
- [ ] **T128** Setup UI store in `frontend/src/stores/uiStore.ts` (loading, errors, modals)
- [ ] **T129** Create App component in `frontend/src/App.tsx` (router, layout, pages, auth provider)

---

## Phase 3.11: Shared Package

- [ ] **T130** [P] Export shared types in `shared/src/types/Agent.ts` (Agent, AgentType)
- [ ] **T131** [P] Export shared types in `shared/src/types/Request.ts` (GenerationRequest, ReviewRequest)
- [ ] **T132** [P] Export shared types in `shared/src/types/Response.ts` (CodeOutput, ReviewReport)
- [ ] **T133** [P] Export shared types in `shared/src/types/Config.ts` (env vars, options)
- [ ] **T134** [P] Export shared constants in `shared/src/constants/prompts.ts` (agent system prompts)
- [ ] **T135** Create shared index in `shared/src/index.ts` (re-export all)

---

## Phase 3.12: Integration Testing (After Implementation)

- [ ] **T136** Run integration test suite (verify T021-T025 pass)
- [ ] **T137** Run performance test suite (verify T026-T028 meet benchmarks)
- [ ] **T138** Run contract test suite (verify T016-T020 pass)
- [ ] **T139** Manual testing of Web UI (all pages, WebSocket streaming, auth flows)
- [ ] **T140** Manual testing of Supabase integration (auth, database, storage, RLS)
- [ ] **T141** Execute quickstart.md scenarios (verify all scenarios pass)
- [ ] **T142** Load testing with 100+ concurrent users (verify performance under load)

---

## Phase 3.13: Documentation & Polish

- [ ] **T143** [P] Write comprehensive README in `README.md` (features, installation, usage, examples)
- [ ] **T144** [P] Create demo GIF/video in `docs/demo.gif` (show Web UI workflows, auth, generation)
- [ ] **T145** [P] Write API documentation in `docs/api.md` (all endpoints, request/response examples)
- [ ] **T146** [P] Write agent architecture docs in `docs/agent-architecture.md` (diagram, agent roles, workflows)
- [ ] **T147** [P] Write deployment guide in `docs/deployment.md` (Vercel + Supabase setup, env vars, troubleshooting)
- [ ] **T148** [P] Write Supabase setup guide in `docs/supabase-setup.md` (project creation, schema migration, RLS config)
- [ ] **T149** [P] Add TSDoc comments to all public APIs (agents, services, tools)
- [ ] **T150** [P] Create Architecture Decision Records in `docs/adr/` (ADR template, 5+ decisions)
- [ ] **T151** Run final code formatting pass (Prettier on all files)
- [ ] **T152** Remove code duplication (DRY principle, extract common logic)
- [ ] **T153** Verify ESLint passes with no warnings
- [ ] **T154** Verify test coverage meets 80% threshold
- [ ] **T155** Update CHANGELOG.md with v1.0.0 release notes

---

## Phase 3.14: CLI Tool (Bonus Feature)

**Note**: This phase is optional and comes AFTER the web application is fully complete and deployed.

### CLI Setup

- [ ] **T156** Create CLI package in `cli/` workspace with Commander.js
- [ ] **T157** Setup CLI TypeScript config in `cli/tsconfig.json`
- [ ] **T158** Create CLI entry point in `cli/src/index.ts` (commands, version, help)
- [ ] **T159** Implement API client in `cli/src/utils/apiClient.ts` (calls web API with auth token)

### CLI Commands

- [ ] **T160** Implement `codeforge login` command in `cli/src/commands/login.ts` (save auth token)
- [ ] **T161** Implement `codeforge logout` command in `cli/src/commands/logout.ts` (clear token)
- [ ] **T162** Implement `codeforge onboard` command in `cli/src/commands/onboard.ts` (scan repo, call API)
- [ ] **T163** Implement `codeforge generate` command in `cli/src/commands/generate.ts` (prompt, options, save output)
- [ ] **T164** Implement `codeforge review` command in `cli/src/commands/review.ts` (read file, display findings)
- [ ] **T165** Implement `codeforge enhance` command in `cli/src/commands/enhance.ts` (proposals, apply diffs)
- [ ] **T166** Implement `codeforge projects` command in `cli/src/commands/projects.ts` (list projects)
- [ ] **T167** Implement `codeforge history` command in `cli/src/commands/history.ts` (generation history)

### CLI Features

- [ ] **T168** Add progress bars with `ora` for long-running operations
- [ ] **T169** Add colored output with `chalk` for better UX
- [ ] **T170** Add interactive prompts with `inquirer` for missing options
- [ ] **T171** Add config file support in `~/.codeforge/config.json`
- [ ] **T172** Create CLI binary with `pkg` for distribution
- [ ] **T173** Write CLI documentation in `docs/cli.md`
- [ ] **T174** Publish CLI to npm as `@codeforge/cli`

---

## Dependencies

**Critical Path**:

1. Setup (T001-T015) → Everything
2. Tests (T016-T028) → Implementation (T029+)
3. Models (T029-T037) → Supabase & Services
4. Supabase Setup (T038-T053) → Services (T066-T074), API (T094-T104)
5. Tools (T054-T065) → Agents (T075-T085)
6. Services (T066-T074) → Workflows (T086-T089), API (T094-T104)
7. Agents (T075-T085) → Workflows (T086-T089)
8. Workflows (T086-T089) → API (T094-T104)
9. API (T090-T104) → Frontend (T105-T129)
10. Implementation (T029-T135) → Integration Tests (T136-T142)
11. Everything → Documentation (T143-T155)
12. **(Optional)** Complete web app → CLI Tool (T156-T174)

**Parallel Opportunities**:

- All Phase 3.2 tests can run in parallel [P]
- All Phase 3.3 models can be created in parallel [P]
- All Phase 3.5 tools can be implemented in parallel [P]
- All Phase 3.7 agent implementations can be done in parallel [P]
- All Phase 3.10 frontend components/pages can be built in parallel [P]
- All Phase 3.13 documentation tasks can be done in parallel [P]
- All Phase 3.14 CLI commands can be implemented in parallel [P]

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
- [x] All 8 entities have model tasks (T029-T037)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent (marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Supabase integration tasks included (T038-T053)
- [x] CLI tasks added as bonus feature at end (T156-T174)
- [x] Total task count: 174 tasks (155 web-only + 19 CLI bonus)

---

## Notes

- **Architecture**: Web-first application with Supabase, optional CLI tool at end
- **Database**: Supabase PostgreSQL with real-time, RLS, and storage
- **Authentication**: Supabase Auth (email/password + OAuth)
- **Deployment**: Vercel (frontend static + backend serverless functions)
- **CLI**: Bonus feature (Phase 3.14) - comes AFTER web app is complete
- **TDD Enforcement**: Phase 3.2 tests MUST fail before implementing Phase 3.3+
- **Parallel Execution**: Tasks marked [P] can run simultaneously (different files, no dependencies)
- **Commit Strategy**: Commit after each task completion
- **Local ADK-TS**: Import from `../../adk-ts/src` (already cloned and built)
- **Model**: Use `AgentBuilder.withModel('gpt-5-nano')` for all agents
- **Environment**: Set `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` before running
- **Testing**: Run tests frequently to catch regressions early
- **Code Quality**: ESLint + Prettier on every commit via Husky

---

**Total Tasks**: 174 (155 core + 19 CLI bonus)  
**Estimated Duration**:

- Core web app: 4-5 weeks (solo developer, full-time)
- CLI tool: +3-4 days (optional, after web app complete)

**Critical Path**: Setup → Tests → Models → Supabase → Tools → Agents → Workflows → API → UI → Integration → Docs → **(Optional) CLI**

**Ready for execution with web-first + Supabase architecture, CLI as bonus!** 🚀
