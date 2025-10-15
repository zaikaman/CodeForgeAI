# Local ADK-TS Setup Guide

## Overview
This project uses a **local clone** of the ADK-TS framework instead of the npm package. This approach provides:
- Direct access to latest development features
- Ability to customize/extend the framework
- Easier debugging and source code exploration
- No dependency on npm package versions

## Repository Location
```
CodeForgeAI/
├── adk-ts/              # Local ADK clone (sibling to packages/)
└── packages/
    ├── backend/         # Imports from ../../adk-ts
    ├── frontend/
    └── shared/
```

## Setup Steps

### 1. Clone Completed ✅
```bash
git clone https://github.com/IQAIcom/adk-ts
# Location: C:\Users\ADMIN\Desktop\CodeForgeAI\adk-ts
```

### 2. Install ADK Dependencies
```bash
cd adk-ts
npm install
npm run build  # Build TypeScript to dist/
```

### 3. Link in Backend Package
In `packages/backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@iqai/adk-ts": ["../../adk-ts/src"],
      "@iqai/adk-ts/*": ["../../adk-ts/src/*"]
    }
  }
}
```

### 4. Import in Code
```typescript
// packages/backend/src/agents/orchestrator.ts
import { ADK, Agent, Tool } from '@iqai/adk-ts';

// Or relative import:
import { ADK } from '../../../adk-ts/src';
```

## Development Workflow

### Hot Reload Support
For development, run ADK in watch mode:
```bash
cd adk-ts
npm run dev  # Watch mode with auto-rebuild
```

### Version Pinning
Track ADK version in `packages/backend/package.json`:
```json
{
  "dependencies": {
    "@iqai/adk-ts": "file:../../adk-ts"
  }
}
```

### Updates
Pull latest ADK changes:
```bash
cd adk-ts
git pull origin main
npm install  # Update dependencies if needed
npm run build
```

## TypeScript Configuration

### Root tsconfig.json
```json
{
  "references": [
    { "path": "./adk-ts" },
    { "path": "./packages/backend" },
    { "path": "./packages/frontend" },
    { "path": "./packages/shared" }
  ]
}
```

### Backend tsconfig.json
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@iqai/adk-ts": ["../../adk-ts/src/index.ts"]
    }
  },
  "references": [
    { "path": "../../adk-ts" }
  ]
}
```

## Benefits of Local Setup

1. **Development Speed**: No npm publish/install cycle
2. **Debugging**: Step through ADK source code directly
3. **Customization**: Extend or modify framework as needed
4. **Documentation**: Read source code for API understanding
5. **Version Control**: Pin to specific commit/branch

## Potential Issues & Solutions

### Issue: Module Resolution Errors
**Solution**: Ensure `tsconfig.json` paths are correct and relative to project root.

### Issue: Build Errors in ADK
**Solution**: 
```bash
cd adk-ts
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Import Path Conflicts
**Solution**: Use consistent import style (either alias or relative) throughout codebase.

### Issue: Type Definitions Not Found
**Solution**: Ensure `adk-ts/src/index.ts` exports all types:
```typescript
export * from './adk';
export * from './agent';
export * from './tool';
export * from './types';
```

## Testing with Local ADK

### Unit Tests
```typescript
// packages/backend/tests/agents/orchestrator.test.ts
import { ADK } from '@iqai/adk-ts';

describe('Orchestrator with Local ADK', () => {
  it('should initialize ADK from local source', () => {
    const adk = new ADK({ model: 'gpt-5-nano' });
    expect(adk).toBeDefined();
  });
});
```

### Integration Tests
Run full stack with local ADK:
```bash
# Terminal 1: Build ADK in watch mode
cd adk-ts && npm run dev

# Terminal 2: Run backend with local ADK
cd packages/backend && npm run dev

# Terminal 3: Run tests
cd packages/backend && npm test
```

## Documentation References

- ADK-TS GitHub: https://github.com/IQAIcom/adk-ts
- Local ADK Source: `CodeForgeAI/adk-ts/src/`
- ADK Examples: `CodeForgeAI/adk-ts/examples/`
- ADK Tests: `CodeForgeAI/adk-ts/tests/`

## Constitutional Compliance

✅ **Code Quality**: TypeScript paths provide type safety
✅ **Testing**: Local setup enables better test debugging
✅ **UX**: No network dependency for ADK during development
✅ **Performance**: Faster builds (no npm package overhead)

---

**Created**: 2025-10-07  
**Status**: Active  
**Owner**: CodeForge AI Team
