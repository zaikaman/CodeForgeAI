# Quickstart Guide: CodeForge AI

**Purpose**: Step-by-step guide to verify end-to-end functionality

---

## Prerequisites

- Node.js 20+ installed
- OpenAI API key
- Sample project repository (or use provided example)

---

## Setup

### 1. Install CodeForge AI
```bash
npm install -g @codeforge/cli
# or clone and run locally
git clone https://github.com/yourorg/codeforge-ai
cd codeforge-ai
npm install
npm run build
```

### 2. Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env and add:
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
NODE_ENV=development
```

### 3. Start Services
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend (optional)
cd frontend
npm run dev

# Or use monorepo command:
npm run dev  # Starts both concurrently
```

---

## Test Scenario 1: Onboard a Project

**Objective**: Scan existing codebase and build context

### Steps

1. **Prepare test repository**:
```bash
mkdir -p ~/test-project/src
cd ~/test-project
npm init -y
```

2. **Create sample file**:
```typescript
// ~/test-project/src/utils.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

3. **Onboard via CLI**:
```bash
codeforge onboard ~/test-project
```

### Expected Output
```
✓ Scanning repository...
✓ Parsing 1 files...
✓ Generating embeddings...
✓ Project onboarded successfully!

Project ID: a1b2c3d4-5678-90ab-cdef-1234567890ab
Language: TypeScript
Files: 1
Lines: 5
Embeddings: 1

Context saved to ~/.codeforge/db.json
```

### Verification
```bash
# Check database
cat ~/.codeforge/db.json | jq '.projects'

# Should show project entry with embeddings
```

---

## Test Scenario 2: Generate Code

**Objective**: Create a new function with tests from prompt

### Steps

1. **Generate via CLI**:
```bash
codeforge generate "Create a function to validate email addresses" \
  --type=function \
  --project-id=a1b2c3d4-5678-90ab-cdef-1234567890ab
```

2. **Review output**:
```
🤖 SpecInterpreter: Analyzing prompt...
🤖 CodeGenerator: Writing function...
🤖 TestCrafter: Generating tests...
🤖 BugHunter: Reviewing code...

✓ Generated validateEmail function
  File: src/validators/email.ts
  Lines: 15
  Tests: 8 scenarios
  Review Score: 94/100
  Confidence: 0.91

Code:
------
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
------

Apply changes? [y/N]
```

3. **Apply changes** (optional):
```bash
# Type 'y' or use --apply flag
codeforge generate "..." --apply
```

### Expected Output Files
- `src/validators/email.ts` (generated function)
- `src/validators/email.test.ts` (generated tests)

### Verification
```bash
# Run generated tests
cd ~/test-project
npm test -- email.test.ts

# Should show: 8 passing tests
```

---

## Test Scenario 3: Review Existing Code

**Objective**: Analyze code for issues with multi-agent review

### Steps

1. **Create buggy code**:
```typescript
// ~/test-project/src/bug.ts
export function divide(a, b) {
  return a / b;  // No zero check!
}
```

2. **Run review**:
```bash
codeforge review ~/test-project/src/bug.ts
```

### Expected Output
```
🤖 Multi-agent review in progress...

✓ Review complete

Findings (3 issues):

[HIGH] Bug - Division by zero not handled
  Line 2: return a / b;
  Fix: Add check: if (b === 0) throw new Error('...')

[MEDIUM] Style - Missing type annotations
  Line 1: Parameters 'a' and 'b' lack types
  Fix: Add types: (a: number, b: number)

[LOW] Documentation - Function lacks JSDoc
  Line 1: No description provided
  Fix: Add /** ... */ comment

Overall Score: 65/100

Recommendations:
  1. Add input validation
  2. Add TypeScript types
  3. Add documentation
```

### Verification
- Review identifies 3+ issues
- Provides actionable fix suggestions
- Score reflects code quality

---

## Test Scenario 4: Enhance Code

**Objective**: Improve code with agent-proposed refactoring

### Steps

1. **Enhance the buggy function**:
```bash
codeforge enhance ~/test-project/src/bug.ts \
  --goal="Add type safety and error handling"
```

### Expected Output
```
🤖 SecuritySentinel: Checking safety...

✓ Enhancement proposal ready

Changes:
  + Added type annotations
  + Added zero division check
  + Added JSDoc documentation
  ~ Renamed to 'safeDivide'

Diff:
------
- export function divide(a, b) {
-   return a / b;
+ /**
+  * Safely divides two numbers
+  * @throws {Error} If divisor is zero
+  */
+ export function safeDivide(a: number, b: number): number {
+   if (b === 0) {
+     throw new Error('Cannot divide by zero');
+   }
+   return a / b;
  }
------

Impact:
  Lines changed: 7
  Complexity: +1 (conditional added)
  Estimated effort: Low

Apply? [y/N]
```

### Verification
```bash
# Apply and test
codeforge enhance ... --apply
npm test

# Should pass with improved code
```

---

## Test Scenario 5: Web UI Session

**Objective**: Interactive code generation with streaming

### Steps

1. **Open web UI**:
```bash
open http://localhost:5173
```

2. **Enter prompt**:
```
Create a React component for a todo list with add/remove/toggle
```

3. **Watch streaming output**:
- See agent thoughts in real-time
- Code appears incrementally in Monaco editor
- Review feedback streams as generated

4. **Interject mid-generation** (optional):
```
Use TypeScript interfaces for props
```

### Expected Behavior
- Agents respond to interjection
- Code updates reflect new constraint
- Final output includes TypeScript types

### Verification
- Generated component is syntactically valid
- Tests are generated and pass
- Review score > 80

---

## Test Scenario 6: VS Code Extension

**Objective**: Inline generation in editor

### Steps

1. **Install extension**:
```bash
cd vscode-extension
npm run package
code --install-extension codeforge-*.vsix
```

2. **Open VS Code** in test project:
```bash
code ~/test-project
```

3. **Select text**:
```typescript
// src/api.ts
// TODO: Add user authentication endpoint
```

4. **Trigger command**:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Select `CodeForge: Generate from Selection`

### Expected Output
- Status bar shows "CodeForge: Generating..."
- Code appears at cursor position after ~10s
- Notification: "Generated 45 lines"

### Verification
```typescript
// Generated code inserted:
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthToken> {
  // ... implementation
}
```

---

## Test Scenario 7: Batch Generation

**Objective**: Generate multiple components in one request

### Steps

1. **Create prompts file**:
```bash
cat > prompts.txt << EOF
Create a Button component with variants
Create an Input component with validation
Create a Card component with header/footer
EOF
```

2. **Run batch generation**:
```bash
codeforge generate --batch=prompts.txt --type=component
```

### Expected Output
```
Processing 3 prompts...

[1/3] Button component
  ✓ Generated (8.2s)
  ✓ Review score: 89

[2/3] Input component
  ✓ Generated (9.5s)
  ✓ Review score: 92

[3/3] Card component
  ✓ Generated (7.8s)
  ✓ Review score: 87

Summary:
  Total: 3
  Success: 3
  Failed: 0
  Avg time: 8.5s
  Avg score: 89.3

Files created:
  src/components/Button.tsx (+ tests)
  src/components/Input.tsx (+ tests)
  src/components/Card.tsx (+ tests)
```

### Verification
- 3 component files created
- 3 test files created
- All tests pass

---

## Performance Benchmarks

**Acceptance Criteria**:
- Onboarding (<100 files): < 10 seconds
- Simple generation: < 10 seconds
- Complex generation: < 30 seconds
- Review: < 5 seconds
- Web UI responsive: < 100ms interactions

### Measure
```bash
# Time onboarding
time codeforge onboard ~/test-project

# Time generation
time codeforge generate "Create a REST API endpoint"

# Verify latency
codeforge config --check-performance
```

---

## Troubleshooting

### OpenAI API Error
```
Error: OpenAI API key not found
Fix: Set OPENAI_API_KEY in .env
```

### Project Not Found
```
Error: Project ID does not exist
Fix: Run 'codeforge onboard' first
```

### Port Already in Use
```
Error: Port 3000 is already in use
Fix: Set PORT=3001 in .env or kill process on 3000
```

---

## Success Criteria

All scenarios must pass:
- ✅ Onboard completes without errors
- ✅ Generation produces valid, tested code
- ✅ Review identifies real issues
- ✅ Enhancement improves code measurably
- ✅ Web UI streams in real-time
- ✅ VS Code extension integrates seamlessly
- ✅ Batch processing handles multiple prompts
- ✅ Performance meets <30s for complex operations

---

## Next Steps

After quickstart validation:
1. Integrate with real projects
2. Customize agent prompts
3. Add language plugins (Go, Rust, etc.)
4. Deploy to Vercel
5. Share demo GIF with team

**Ready for production use after all scenarios pass** ✅
