/**
 * Pre-Validation Rules - Prevent common AI mistakes BEFORE generation
 * 
 * These rules should be embedded in the AI prompt to guide better code generation
 */

export const VALIDATION_RULES = {
  typescript: {
    imports: [
      "Always import hooks at the top of React components: import { useState, useEffect } from 'react'",
      "Always import Next.js routing hook from 'next/router' package",
      "Never access routing hook as a property, import and call it directly",
      "Never use require() for hooks, always use ES6 imports"
    ],
    
    syntax: [
      "Use template strings carefully - avoid nested backticks in map functions",
      "For sitemap.xml or similar XML generation, use String.raw or escape properly",
      "Always use className={...} not className{...} in JSX",
      "Always add semicolons at the end of statements"
    ],
    
    modules: [
      'If package.json has "type": "module", use ES modules (export default, import)',
      "Never mix CommonJS (module.exports, require) with ES modules",
      "For Next.js config in ESM projects, name it next.config.cjs or use export default"
    ],
    
    dependencies: [
      "Always include all required dependencies in package.json",
      "For React projects: react, react-dom, @types/react, @types/react-dom",
      "For Next.js: next, @types/node",
      "For data fetching: swr or react-query",
      "Always specify version numbers like ^18.3.1, never use 'latest'"
    ],
    
    nextjs: [
      "In Next.js 13+, use App Router (app/) or Pages Router (pages/), not both",
      "API routes go in pages/api/ or app/api/",
      "Dynamic imports should use next/dynamic",
      "Use next/link for navigation, next/image for images"
    ],
    
    hooks: [
      "React hooks must be called at the top level of components",
      "Next.js routing hook returns router object with push(), query, etc. methods",
      "Never call hooks inside loops, conditions, or nested functions",
      "Custom hooks must start with 'use' prefix"
    ]
  },
  
  javascript: {
    common: [
      "Prefer const over let when variables don't change",
      "Use async/await instead of .then() chains",
      "Always handle errors with try/catch in async functions"
    ]
  },
  
  react: {
    components: [
      "Functional components are preferred over class components",
      "Always export components: export default function ComponentName()",
      "Props should be typed in TypeScript: function MyComponent(props: Props)",
      "Use meaningful component names in PascalCase"
    ],
    
    state: [
      "Initialize useState with proper types: const [count, setCount] = useState<number>(0)",
      "Never mutate state directly, always use setState function",
      "For complex state, consider useReducer"
    ]
  },
  
  common: {
    files: [
      "Always include package.json with name, version, scripts, dependencies",
      "Include tsconfig.json for TypeScript projects",
      "Include .gitignore to exclude node_modules, .env, build files",
      "README.md should have setup instructions"
    ],
    
    structure: [
      "Organize code: src/components/, src/pages/, src/utils/, src/types/",
      "Keep components small and focused on one responsibility",
      "Extract reusable logic into custom hooks or utility functions"
    ]
  }
};

/**
 * Generate a prompt addition that includes validation rules
 */
export function generateValidationPrompt(language: string = 'typescript'): string {
  const rules = VALIDATION_RULES[language as keyof typeof VALIDATION_RULES] || VALIDATION_RULES.common;
  
  let prompt = '\n\n## CRITICAL CODE QUALITY RULES - MUST FOLLOW:\n\n';
  
  for (const [category, ruleList] of Object.entries(rules)) {
    prompt += `### ${category.toUpperCase()}:\n`;
    for (const rule of ruleList as string[]) {
      prompt += `- ${rule}\n`;
    }
    prompt += '\n';
  }
  
  // Add React-specific rules for React projects
  if (language === 'typescript' || language === 'javascript') {
    prompt += '### REACT COMPONENTS:\n';
    for (const rule of VALIDATION_RULES.react.components) {
      prompt += `- ${rule}\n`;
    }
    prompt += '\n';
    
    prompt += '### REACT STATE:\n';
    for (const rule of VALIDATION_RULES.react.state) {
      prompt += `- ${rule}\n`;
    }
    prompt += '\n';
  }
  
  prompt += '### COMMON BEST PRACTICES:\n';
  for (const [_category, ruleList] of Object.entries(VALIDATION_RULES.common)) {
    for (const rule of ruleList as string[]) {
      prompt += `- ${rule}\n`;
    }
  }
  
  prompt += '\n⚠️ IMPORTANT: Follow these rules strictly to ensure the generated code compiles and runs without errors.\n\n';
  
  return prompt;
}

/**
 * Get specific rules for error prevention
 */
export function getErrorPreventionRules(): string[] {
  return [
    // From your actual deployment errors:
    "1. NEVER access routing hook as property of Router object - Import routing hook directly from 'next/router' and call it",
    "2. ALWAYS include 'swr' in package.json if using useSWR hook",
    "3. AVOID nested template strings with backticks - use String.raw or concatenation for XML/HTML generation",
    "4. CHECK all imports are listed in package.json dependencies or devDependencies",
    "5. USE proper TypeScript syntax - no 'require' for hooks, no module.exports in ESM",
    "6. VERIFY all React hooks (useState, useEffect, routing hooks) are imported before use",
    "7. TEST template strings for proper escaping - especially in sitemap.xml.ts or similar files",
    "8. ENSURE package.json has correct 'type' field matching the module system used",
    "9. INCLUDE @types/* packages for all non-TypeScript dependencies",
    "10. VALIDATE JSX syntax - use className={...} not className{...}"
  ];
}

/**
 * Get checklist for AI to verify before returning code
 */
export function getAIChecklistPrompt(): string {
  return `
## BEFORE RETURNING CODE - CHECKLIST:

Please verify ALL of these before generating the final code:

✅ 1. All React hooks (useState, useEffect, routing hooks, etc.) are imported at the top
✅ 2. Routing hooks are imported directly from their package, not accessed as properties
✅ 3. All packages used in imports are listed in package.json
✅ 4. Template strings don't have problematic nested backticks
✅ 5. No module.exports if package.json has "type": "module"
✅ 6. All JSX attributes use = sign: className={...} not className{...}
✅ 7. TypeScript types are properly defined for components and functions
✅ 8. No hardcoded values that should be environment variables
✅ 9. All async functions have proper error handling
✅ 10. Code follows consistent formatting (semicolons, indentation)

If ANY item is unchecked, fix it before returning the code.
`;
}
