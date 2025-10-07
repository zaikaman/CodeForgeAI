# API Contract: POST /generate

**Purpose**: Generate code from natural language prompt with auto-review and tests

---

## Request

**Method**: `POST`  
**Path**: `/api/generate`  
**Content-Type**: `application/json`

### Headers
```http
Content-Type: application/json
Authorization: Bearer [optional-token]
```

### Body Schema
```typescript
{
  prompt: string;                  // Natural language description (1-10000 chars)
  type: 'component' | 'function' | 'feature' | 'custom';
  projectId?: string;              // ProjectContext for context-aware generation
  language?: 'typescript' | 'javascript' | 'python'; // Auto-detect if omitted
  options?: {
    generateTests?: boolean;       // Default: true
    autoReview?: boolean;          // Default: true
    targetPath?: string;           // Suggested file location
    iterationLimit?: number;       // Max refinement cycles (1-10, default: 3)
    streaming?: boolean;           // Enable real-time updates (default: false)
  };
}
```

### Example
```json
{
  "prompt": "Create a React component for user authentication with hooks",
  "type": "component",
  "projectId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "language": "typescript",
  "options": {
    "generateTests": true,
    "autoReview": true,
    "streaming": true
  }
}
```

### Validation Rules
- `prompt` MUST be 1-10000 characters
- `type` MUST be valid enum value
- `projectId` MUST exist if provided
- `options.iterationLimit` MUST be 1 ≤ limit ≤ 10

---

## Response

### Success (200 OK) - Non-Streaming
```typescript
{
  success: true;
  data: {
    outputId: string;              // UUID
    code: string;                  // Generated source code
    language: string;
    filePath?: string;             // Suggested location
    tests?: string;                // Test code
    testFilePath?: string;
    validation: {
      syntaxValid: boolean;
      testsGenerated: boolean;
      testsPass: boolean;
      reviewScore: number;         // 0-100
    };
    confidence: {
      overall: number;             // 0-1
      breakdown: {
        correctness: number;
        completeness: number;
        efficiency: number;
        style: number;
      };
    };
    rationale: string;             // Agent explanation
    review?: ReviewReport;         // If autoReview=true
    metadata: {
      generationTime: number;      // milliseconds
      tokensUsed: number;
      iteration: number;           // Final refinement cycle
      agentsInvolved: string[];
    };
  };
}
```

#### Example
```json
{
  "success": true,
  "data": {
    "outputId": "b2c3d4e5-6789-01bc-defg-2345678901bc",
    "code": "import React, { useState } from 'react';\n\nexport const AuthForm: React.FC = () => {\n  const [email, setEmail] = useState('');\n  // ... rest of component\n};",
    "language": "typescript",
    "filePath": "src/components/AuthForm.tsx",
    "tests": "import { render, screen } from '@testing-library/react';\nimport { AuthForm } from './AuthForm';\n\ndescribe('AuthForm', () => {\n  it('renders email input', () => {\n    // ... test implementation\n  });\n});",
    "testFilePath": "src/components/AuthForm.test.tsx",
    "validation": {
      "syntaxValid": true,
      "testsGenerated": true,
      "testsPass": true,
      "reviewScore": 92
    },
    "confidence": {
      "overall": 0.89,
      "breakdown": {
        "correctness": 0.95,
        "completeness": 0.88,
        "efficiency": 0.85,
        "style": 0.90
      }
    },
    "rationale": "Generated React functional component with TypeScript, using hooks for state management. Follows project conventions: named exports, TSX extension, co-located tests.",
    "review": {
      "findings": [],
      "summary": { "totalIssues": 0, "overallScore": 92 }
    },
    "metadata": {
      "generationTime": 8450,
      "tokensUsed": 2450,
      "iteration": 1,
      "agentsInvolved": ["SpecInterpreter", "CodeGenerator", "TestCrafter", "BugHunter"]
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Prompt
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PROMPT",
    "message": "Prompt is too vague or ambiguous",
    "details": {
      "missingInfo": ["Component purpose", "Expected props"],
      "suggestion": "Provide more details about what the component should do"
    }
  }
}
```

#### 400 Bad Request - Project Not Found
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Specified projectId does not exist",
    "details": {
      "projectId": "invalid-uuid"
    }
  }
}
```

#### 422 Unprocessable Entity - Generation Failed
```json
{
  "success": false,
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Unable to generate valid code after max iterations",
    "details": {
      "iterations": 3,
      "lastError": "Syntax validation failed",
      "partialOutput": "/* incomplete code */"
    }
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests",
    "details": {
      "retryAfter": 60,
      "limit": "10 requests per minute"
    }
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "LLM_ERROR",
    "message": "OpenAI API error",
    "details": {
      "provider": "OpenAI",
      "statusCode": 503,
      "retryable": true
    }
  }
}
```

---

## WebSocket Streaming Updates

**When**: `options.streaming === true`  
**Event**: `generate:stream`

### Stream Message Schema
```typescript
{
  outputId: string;
  phase: 'parsing' | 'generating' | 'testing' | 'reviewing' | 'refining' | 'complete';
  message: string;
  code?: string;                   // Partial or complete code
  progress: number;                // 0-100
  metadata?: {
    currentAgent?: string;
    thought?: string;              // Agent reasoning
  };
}
```

### Example Stream Sequence
```javascript
// Phase 1: Parsing
{
  "outputId": "b2c3d4e5...",
  "phase": "parsing",
  "message": "Analyzing prompt structure...",
  "progress": 10,
  "metadata": {
    "currentAgent": "SpecInterpreter",
    "thought": "Detected component generation request with authentication focus"
  }
}

// Phase 2: Generating (incremental code)
{
  "outputId": "b2c3d4e5...",
  "phase": "generating",
  "message": "Writing component skeleton...",
  "code": "import React, { useState } from 'react';\n\nexport const AuthForm: React.FC = () => {",
  "progress": 40,
  "metadata": {
    "currentAgent": "CodeGenerator"
  }
}

// Phase 3: Testing
{
  "outputId": "b2c3d4e5...",
  "phase": "testing",
  "message": "Generating test suite...",
  "progress": 70,
  "metadata": {
    "currentAgent": "TestCrafter",
    "thought": "Creating tests for user input validation"
  }
}

// Phase 4: Reviewing
{
  "outputId": "b2c3d4e5...",
  "phase": "reviewing",
  "message": "Running multi-agent review...",
  "progress": 90,
  "metadata": {
    "currentAgent": "BugHunter"
  }
}

// Complete (final output)
{
  "outputId": "b2c3d4e5...",
  "phase": "complete",
  "message": "Generation complete",
  "code": "[full code]",
  "progress": 100
}
```

---

## Side Effects

1. Creates new `GenerationRequest` entry
2. Creates new `CodeOutput` entry
3. May create `ReviewReport` if `autoReview=true`
4. Appends to `GenerationHistory`
5. Consumes OpenAI API tokens (tracked in metadata)

---

## Performance Expectations

- **Simple function** (<50 lines): 3-8 seconds
- **Component** (50-200 lines): 8-15 seconds
- **Feature** (200-500 lines): 15-30 seconds
- **With auto-review**: +5-10 seconds
- **With iterations**: +(5-10s per cycle)

---

## Example Usage

### cURL
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user signup API endpoint with validation",
    "type": "function",
    "language": "typescript",
    "options": {
      "generateTests": true,
      "autoReview": true
    }
  }'
```

### TypeScript Client
```typescript
const response = await fetch('http://localhost:3000/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a React hook for API data fetching',
    type: 'custom',
    projectId: 'a1b2c3d4...',
    options: { streaming: true }
  })
});

const result = await response.json();
console.log('Generated code:', result.data.code);
```

### CLI
```bash
codeforge generate "Build a REST API for todo items" --type=feature --apply
```

---

## Test Scenarios

1. **Valid generation**: Returns 200 with syntaxValid code
2. **Context-aware**: Uses projectId for style consistency
3. **Auto-review finds issues**: Iteration refines code
4. **Streaming enabled**: Sends incremental updates
5. **Max iterations hit**: Returns 422 with partial output
6. **Rate limit**: Returns 429 with retry-after
7. **OpenAI timeout**: Returns 500 with retryable flag
