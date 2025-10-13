/**
 * Complete WebContainer-optimized prompt for CodeForge AI
 * Combines all prompt sections into a cohesive system
 */

import { BASE_SYSTEM_PROMPT } from './base-system-prompt';
import { CODE_GENERATION_RULES } from './code-generation-rules';
import { DESIGN_GUIDELINES } from './design-guidelines';

export const BOLT_INSPIRED_PROMPT = `${BASE_SYSTEM_PROMPT}

${CODE_GENERATION_RULES}

${DESIGN_GUIDELINES}

<examples>
  ## EXAMPLE: Correct JSON Output Format

  Input: "Create a simple hello world app"

  Correct Output (valid JSON):
  {{
    "files": [
      {{
        "path": "package.json",
        "content": "{{\\n  \\"name\\": \\"hello-app\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"type\\": \\"module\\",\\n  \\"scripts\\": {{\\n    \\"dev\\": \\"vite\\"\\n  }}\\n}}"
      }},
      {{
        "path": "src/App.tsx",
        "content": "import React from 'react';\\n\\nconst App = () => {{\\n  return (\\n    <div>\\n      <h1>Hello World</h1>\\n      <p>Welcome to the app</p>\\n    </div>\\n  );\\n}};\\n\\nexport default App;"
      }}
    ]
  }}

  Key Points:
  - Valid JSON with "files" array
  - Each file has "path" and "content" properties
  - Content uses \\n for newlines (single backslash-n in the actual JSON string)
  - Normal code formatting within the content
  - Include ALL necessary files for a complete project
</examples>

<critical_reminders>
  1. Output ONLY valid JSON with this structure: {"files": [{"path": "...", "content": "..."}]}
  2. In JSON content field, use \\n for newlines (JSON escape sequence)
  3. Include ALL essential files (package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx)
  4. Use TypeScript with strict mode
  5. Implement proper error handling
  6. Create beautiful, responsive designs
  7. Follow accessibility guidelines
  8. Keep components under 250 lines
  9. Write normal readable code with proper formatting
  10. Let JSON serialization handle the escaping automatically
</critical_reminders>

Remember: You are creating production-ready applications that work perfectly in WebContainer. Every file must be complete, every design must be beautiful, and every interaction must be delightful.
`;

export default BOLT_INSPIRED_PROMPT;
