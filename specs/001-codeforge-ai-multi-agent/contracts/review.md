# API Contract: POST /review

**Purpose**: Multi-agent code review with actionable feedback

---

## Request

**Method**: `POST`  
**Path**: `/api/review`

### Body Schema
```typescript
{
  target: {
    type: 'file' | 'code';
    filePath?: string;             // If type='file'
    code?: string;                 // If type='code'
    language?: string;
  };
  projectId?: string;              // For context-aware review
  options?: {
    focus?: ('bugs' | 'security' | 'performance' | 'style')[];
    severity?: 'all' | 'high' | 'critical'; // Filter findings
  };
}
```

### Example
```json
{
  "target": {
    "type": "file",
    "filePath": "/Users/dev/project/src/api/users.ts"
  },
  "projectId": "a1b2c3d4...",
  "options": {
    "focus": ["bugs", "security"],
    "severity": "high"
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
    reviewId: string;
    findings: Finding[];
    summary: {
      totalIssues: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      overallScore: number;        // 0-100
    };
    agentReviews: AgentReview[];
    recommendations: string[];
    metadata: {
      reviewTime: number;
      agentsInvolved: string[];
      timestamp: Date;
    };
  };
}
```

### Error (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TARGET",
    "message": "Must provide either filePath or code"
  }
}
```

---

## Test Scenarios
1. Review existing file: Returns findings
2. Review code snippet: Validates syntax first
3. Focus on security: Only security findings
4. Clean code: Returns empty findings array
5. File not found: Returns 400 error
