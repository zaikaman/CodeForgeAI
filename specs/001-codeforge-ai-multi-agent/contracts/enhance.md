# API Contract: POST /enhance

**Purpose**: Generate code improvements with diffs and rationale

---

## Request

**Method**: `POST`  
**Path**: `/api/enhance`

### Body Schema
```typescript
{
  target: {
    type: 'file' | 'code' | 'outputId';
    filePath?: string;
    code?: string;
    outputId?: string;             // CodeOutput to enhance
  };
  goal: string;                    // Enhancement objective
  projectId?: string;
  options?: {
    applyChanges?: boolean;        // Default: false
    generateDiff?: boolean;        // Default: true
  };
}
```

### Example
```json
{
  "target": {
    "type": "outputId",
    "outputId": "b2c3d4e5..."
  },
  "goal": "Optimize for performance and add error handling",
  "options": {
    "applyChanges": false,
    "generateDiff": true
  }
}
```

---

## Response

### Success (200 OK)
```typescript
{
  success: true;
  data: {
    proposalId: string;
    originalCode: string;
    enhancedCode: string;
    diff: DiffChunk[];
    changes: Change[];
    impact: {
      linesChanged: number;
      complexityDelta: number;
      estimatedEffort: 'low' | 'medium' | 'high';
    };
    rationale: string;
    risks: string[];
    metadata: {
      proposedBy: string[];
      timestamp: Date;
    };
  };
}
```

### Error (422 Unprocessable)
```json
{
  "success": false,
  "error": {
    "code": "ENHANCEMENT_FAILED",
    "message": "Unable to improve code without breaking functionality",
    "details": {
      "reason": "Refactoring would change public API"
    }
  }
}
```

---

## Test Scenarios
1. Enhance with valid goal: Returns proposal with diffs
2. Apply changes: Writes to file and returns confirmation
3. Conflicting goal: Returns 422 with explanation
4. Target not found: Returns 400 error
