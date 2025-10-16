# GitHubAgent Performance Optimization Guide

## 🚀 Current Performance Issues

- **Total Execution Time**: ~378 seconds (6+ minutes) 
- **Unnecessary Tool Calls**: 70+ tool calls for a simple model replacement task
- **File Operations**: Multiple redundant reads of the same file
- **Search Inefficiency**: Searching for patterns that don't exist

---

## 📋 Optimization Strategies

### 1. **Add Clear Plan-Before-Execute Requirement**

**Current Problem**: Agent explores randomly without a clear strategy.

**Solution - Add to System Prompt**:
```
BEFORE executing any tools:
1. Analyze the requirement and create a DETAILED PLAN
2. Identify EXACTLY which files need modification
3. Determine the PRECISE text replacements needed
4. Execute plan sequentially with NO REDUNDANT operations

Plan Format:
- Files to analyze: [list]
- Modifications needed: [specific old text → new text]
- Expected tool calls: [exact count]
- Success criteria: [specific]
```

### 2. **Batch File Operations**

**Current**: Reading same file 3-4 times in different contexts

**Optimized**: Read once, cache, reference in subsequent operations

```typescript
// Current (SLOW):
getFile(generation.py) // First read
search(gemini) // Context
getFile(generation.py) // Second read
search(fallback) // Context
getFile(generation.py) // Third read

// Optimized (FAST):
getFile(generation.py) // Read once, store content
search(gemini, fallback, etc.) // Single batch search
THEN proceed with replacements using cached content
```

### 3. **Search Smarter, Not Harder**

**Current Problem**: 
```
- Search for "gemini" → finds 15 matches
- Search for "gemini-2.5-pro" → finds 0 matches
- Search for "fallback" → finds 0 matches
- Multiple redundant searches
```

**Optimized**:
```
Create SINGLE comprehensive search query that identifies:
- ALL model references
- ALL fallback logic
- Configuration patterns

Pattern: "models\s*=|fallback|gemini-[0-9]"
Result: One search call identifies all relevant sections
```

### 4. **Consolidate Replacement Operations**

**Current Flow**:
```
Replace attempt 1 → fails (whitespace mismatch)
Replace attempt 2 → fails (text not found)
Replace attempt 3 → succeeds
Replace attempt 4 → redundant
```

**Optimized Flow**:
```
Get file content
Parse and identify exact replacement locations
Execute ALL replacements in SINGLE operation
Verify once
Commit once
```

### 5. **Parallel Tool Execution Where Safe**

Some operations can run concurrently:
```
// Can parallelize:
- Searching in different files
- Reading different files
- Creating branch + fetching file simultaneously

// Cannot parallelize:
- Commit (depends on file edits)
- PR creation (depends on commit)
```

---

## 🔧 Recommended Prompt Changes

### **For GitHubAgent System Prompt**:

```markdown
# EXECUTION DISCIPLINE

## Phase 1: PLAN (No tools called)
Analyze the GitHub issue/PR requirement.
Create a step-by-step modification plan.
Identify exact files and text replacements.
Count expected tool calls (success = actual ≈ expected).

## Phase 2: ANALYZE (2-3 strategic tool calls)
Preload repository: 1 call
Search for ALL affected patterns: 1 comprehensive call
Get file content: 1 call per modified file

## Phase 3: IMPLEMENT (Minimal tool calls)
Create branch: 1 call
Replace all modifications: Batch in 1-2 calls
Commit: 1 call
Create PR: 1 call

## Tool Call Budget
- Feature modifications: ≤ 10 calls
- Complex refactoring: ≤ 15 calls
- Large PRs: ≤ 20 calls
Exceeding budget = re-evaluate strategy
```

### **Add Success Criteria Template**:

```markdown
## SUCCESS METRICS
✓ Tool calls used: [actual] / [planned]
✓ Files modified: [count]
✓ PR created: [yes/no]
✓ Time spent: [seconds]

If actual tool calls > planned + 3:
  PAUSE and re-evaluate approach
```

---

## 📊 Expected Improvements

| Metric | Current | Optimized | Improvement |
|--------|---------|-----------|-------------|
| Total Time | 378s | ~60s | **84% faster** |
| Tool Calls | 70+ | ~12 | **83% fewer** |
| File Reads | 8+ | 1-2 | **80% fewer** |
| Search Calls | 4 | 1 | **75% fewer** |
| Wasted Operations | ~40 | ~1 | **97% reduction** |

---

## 🎓 Key Principles

1. **Plan First, Execute Second** - No tool calls until plan is created
2. **Batch Operations** - Group similar operations
3. **Cache Results** - Don't re-read files
4. **Single Search Pass** - Use comprehensive regex patterns
5. **Measure Success** - Track actual vs expected tool calls
6. **Fail Fast** - If tool calls exceed budget, stop and revise

---

## 🔍 Implementation Example

**Before (SLOW - 70+ calls, 378s)**:
```
PreloadRepo → Search(gemini) → GetFile → Search(pro) → 
GetFile → Search(fallback) → GetFile → Replace(fail) → 
Replace(retry) → GetFile → ... [continues 50+ more calls]
```

**After (FAST - 12 calls, ~60s)**:
```
1. PreloadRepo
2. Search(comprehensive pattern)
3. GetFile(generation.py)
4. ReplaceText(all changes batched)
5. CommitFiles
6. CreatePR
7. GetFile(verify)
8. ListPRs(confirm)
```

---

## 📝 Action Items

- [ ] Update GitHubAgent system prompt with PLAN-FIRST discipline
- [ ] Add tool call counter and budget enforcement
- [ ] Implement search pattern optimization
- [ ] Batch replacement operations
- [ ] Add execution time metrics to response
- [ ] Create agent performance dashboard
