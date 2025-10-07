# API Contract: POST /onboard

**Purpose**: Onboard an existing project repository for context-aware code generation

---

## Request

**Method**: `POST`  
**Path**: `/api/onboard`  
**Content-Type**: `application/json`

### Headers
```http
Content-Type: application/json
Authorization: Bearer [optional-token]
```

### Body Schema
```typescript
{
  repoPath: string;              // Absolute path to project directory
  options?: {
    includeTests?: boolean;      // Include test files in embedding (default: true)
    maxFiles?: number;           // Limit files scanned (default: 10000)
    githubToken?: string;        // Optional GitHub API token for MCP
    progressCallback?: boolean;  // Enable WebSocket progress updates
  };
}
```

### Example
```json
{
  "repoPath": "/Users/dev/my-project",
  "options": {
    "includeTests": true,
    "maxFiles": 5000,
    "progressCallback": true
  }
}
```

### Validation Rules
- `repoPath` MUST be an absolute path
- `repoPath` MUST exist and be readable
- `repoPath` MUST contain at least one code file (.ts, .js, .py)
- `options.maxFiles` MUST be 1 ≤ maxFiles ≤ 100000

---

## Response

### Success (201 Created)
```typescript
{
  success: true;
  data: {
    projectId: string;           // UUID for future requests
    context: {
      name: string;
      language: string;
      framework?: string;
      totalFiles: number;
      totalLines: number;
      embeddingsGenerated: number;
    };
    metadata: {
      scanDuration: number;      // milliseconds
      timestamp: Date;
    };
  };
}
```

#### Example
```json
{
  "success": true,
  "data": {
    "projectId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "context": {
      "name": "my-project",
      "language": "typescript",
      "framework": "react",
      "totalFiles": 245,
      "totalLines": 18432,
      "embeddingsGenerated": 1247
    },
    "metadata": {
      "scanDuration": 12450,
      "timestamp": "2025-10-07T12:34:56.789Z"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Path
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PATH",
    "message": "Repository path does not exist or is not accessible",
    "details": {
      "providedPath": "/nonexistent/path"
    }
  }
}
```

#### 400 Bad Request - No Code Files
```json
{
  "success": false,
  "error": {
    "code": "NO_CODE_FILES",
    "message": "No supported code files found in repository",
    "details": {
      "supportedExtensions": [".ts", ".tsx", ".js", ".jsx", ".py"]
    }
  }
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "error": {
    "code": "REPO_TOO_LARGE",
    "message": "Repository exceeds maximum file limit",
    "details": {
      "filesFound": 150000,
      "maxFiles": 100000,
      "suggestion": "Use options.maxFiles to limit or exclude directories"
    }
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "EMBEDDING_FAILED",
    "message": "Failed to generate embeddings for project",
    "details": {
      "failedAt": "vector generation",
      "retryable": true
    }
  }
}
```

---

## WebSocket Progress Updates

**When**: `options.progressCallback === true`  
**Event**: `onboard:progress`

### Progress Message Schema
```typescript
{
  projectId: string;
  phase: 'scanning' | 'parsing' | 'embedding' | 'complete';
  progress: number;              // 0-100
  message: string;
  details?: {
    currentFile?: string;
    filesProcessed?: number;
    totalFiles?: number;
  };
}
```

### Example WebSocket Messages
```javascript
// Phase 1: Scanning
{
  "projectId": "a1b2c3d4...",
  "phase": "scanning",
  "progress": 25,
  "message": "Scanning directory structure...",
  "details": {
    "filesProcessed": 50,
    "totalFiles": 200
  }
}

// Phase 2: Parsing
{
  "projectId": "a1b2c3d4...",
  "phase": "parsing",
  "progress": 60,
  "message": "Parsing AST for components...",
  "details": {
    "currentFile": "src/App.tsx"
  }
}

// Phase 3: Embedding
{
  "projectId": "a1b2c3d4...",
  "phase": "embedding",
  "progress": 90,
  "message": "Generating vector embeddings...",
  "details": {
    "filesProcessed": 180,
    "totalFiles": 200
  }
}

// Complete
{
  "projectId": "a1b2c3d4...",
  "phase": "complete",
  "progress": 100,
  "message": "Onboarding complete"
}
```

---

## Side Effects

1. Creates new `ProjectContext` entry in database
2. Generates vector embeddings stored locally
3. Caches AST representations of key files
4. Initializes `GenerationHistory` for project
5. Optionally fetches GitHub metadata if token provided

---

## Performance Expectations

- **Small project** (<100 files): 2-5 seconds
- **Medium project** (100-1000 files): 10-30 seconds
- **Large project** (1000-10000 files): 30-120 seconds
- **Progress updates**: Every 5% or 10 files processed

---

## Example Usage

### cURL
```bash
curl -X POST http://localhost:3000/api/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "repoPath": "/Users/dev/my-project",
    "options": {
      "includeTests": true,
      "progressCallback": false
    }
  }'
```

### TypeScript Client
```typescript
const response = await fetch('http://localhost:3000/api/onboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repoPath: '/Users/dev/my-project',
    options: { includeTests: true }
  })
});

const result = await response.json();
if (result.success) {
  console.log('Project ID:', result.data.projectId);
}
```

### CLI
```bash
codeforge onboard /Users/dev/my-project --github-token=ghp_xxx
```

---

## Test Scenarios

1. **Valid onboarding**: Returns 201 with projectId
2. **Invalid path**: Returns 400 with INVALID_PATH
3. **Empty directory**: Returns 400 with NO_CODE_FILES
4. **Large repo**: Returns 201 after progress updates
5. **Duplicate onboarding**: Updates existing ProjectContext
6. **Permission denied**: Returns 403 error
7. **Network timeout** (GitHub): Continues with local-only
