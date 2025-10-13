/**
 * Code generation rules for CodeForge AI
 * Based on bolt.diy's proven patterns
 */

export const CODE_GENERATION_RULES = `
<code_generation_rules>
  ## FILE GENERATION REQUIREMENTS

  1. **Complete Files Only**:
     - NEVER generate partial code or diffs
     - ALWAYS provide complete file content from start to finish
     - No "...rest of the code..." or "...existing code..." comments
     - Every file must be self-contained and immediately usable

  2. **JSON Content Format (CRITICAL)**:
     - Write code content as NORMAL multi-line code
     - In the JSON, use actual newline characters (\\n) for line breaks
     - Do NOT manually escape quotes multiple times
     - Let JSON.stringify handle the escaping automatically
     - Example JSON format:
       {
         "path": "src/App.tsx",
         "content": "import React from 'react';\\n\\nconst App = () => {\\n  return <div>Hello</div>;\\n};\\n\\nexport default App;"
       }

  3. **Essential Project Files**:
     You MUST include these files in every project:

     a) **package.json**:
        - Project name and version
        - Type: "module"
        - Scripts: "dev", "build", "preview"
        - All required dependencies
        - Vite and plugins in devDependencies

     b) **vite.config.ts**:
        - React plugin configuration
        - Port settings (default 5173)
        - Build optimizations
        - Path aliases if needed

     c) **tsconfig.json**:
        - Strict mode enabled
        - Modern target (ES2020+)
        - Module: "ESNext"
        - ModuleResolution: "bundler"
        - JSX configuration

     d) **index.html**:
        - DOCTYPE and html structure
        - Root div element (id="root")
        - Script tag: <script type="module" src="/src/main.tsx"></script>
        - Proper meta tags (charset, viewport)

     e) **src/main.tsx**:
        - React 18 rendering
        - App component import
        - Root element mounting

  4. **Modern TypeScript Standards**:
     - Use strict TypeScript (no 'any' unless necessary)
     - Proper interfaces and type definitions
     - Functional components with hooks
     - Avoid classes unless specifically needed
     - Use const assertions where appropriate

  5. **React Best Practices**:
     - Functional components only
     - Use hooks (useState, useEffect, useContext, etc.)
     - Proper prop typing with interfaces
     - Handle loading and error states
     - Use React.memo for expensive components
     - Implement proper key props in lists

  6. **Error Handling**:
     - Wrap async operations in try-catch
     - Provide user-friendly error messages
     - Handle edge cases (null, undefined, empty arrays)
     - Implement error boundaries for React apps

  7. **Code Organization**:
     - Keep components under 250 lines
     - Extract complex logic into custom hooks
     - Separate business logic from UI components
     - Use proper folder structure:
       src/
       ├── components/    (reusable UI components)
       ├── hooks/         (custom React hooks)
       ├── utils/         (utility functions)
       ├── types/         (TypeScript types)
       └── services/      (API calls, business logic)

  8. **Styling Approach**:
     - PREFER: Tailwind CSS (PostCSS, no native deps)
     - ALTERNATIVE: CSS Modules, vanilla CSS
     - AVOID: Sass (requires native binaries)
     - Always include proper responsive design
     - Use semantic color names and spacing

  9. **State Management**:
     - Simple state: useState
     - Global state: useContext + useReducer
     - Complex state: Zustand, Jotai, or Valtio
     - AVOID: Redux (unless specifically requested)

  10. **Performance Optimization**:
      - Lazy load routes and components
      - Use React.lazy and Suspense
      - Implement code splitting
      - Optimize bundle size
      - Use proper dependency arrays in useEffect

  11. **Accessibility**:
      - Semantic HTML elements
      - ARIA labels where needed
      - Keyboard navigation support
      - Proper focus management
      - Alt text for images

  ## TECHNOLOGY STACK PREFERENCES

  **Frontend Framework:**
  - ✓ PREFER: Vite + React + TypeScript
  - ✓ ALTERNATIVE: Vanilla TypeScript with Vite
  - ✗ AVOID: Next.js, Remix (require server runtime)

  **UI Libraries (WebContainer-compatible):**
  - ✓ Radix UI (headless components)
  - ✓ Headless UI
  - ✓ Material-UI (MUI)
  - ✓ Ant Design
  - ✓ DaisyUI with Tailwind

  **Data Fetching:**
  - ✓ Native Fetch API
  - ✓ Axios
  - ✓ React Query / TanStack Query
  - ✓ SWR

  **Databases:**
  - ✓ PREFER: Supabase (hosted PostgreSQL)
  - ✓ ALTERNATIVE: Firebase, PocketBase
  - ✗ AVOID: SQLite, PostgreSQL client (require native binaries)

  **Form Handling:**
  - ✓ React Hook Form
  - ✓ Formik
  - ✓ Zod for validation

  ## PACKAGE.JSON TEMPLATE

  \`\`\`json
  {
    "name": "project-name",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.2.0",
      "typescript": "^5.3.0",
      "vite": "^5.0.0",
      "tailwindcss": "^3.4.0",
      "postcss": "^8.4.32",
      "autoprefixer": "^10.4.16"
    }
  }
  \`\`\`

  ## COMMON PATTERNS

  1. **React Component Pattern:**
     - Define props interface with proper types
     - Use functional components with React.FC
     - Destructure props in function parameters
     - Return JSX with proper event handlers and className

  2. **Custom Hook Pattern:**
     - Export hooks with 'use' prefix
     - Use useState for local state
     - Return object with state and handlers
     - Accept initial values as parameters

  3. **API Service Pattern:**
     - Create async functions for API calls
     - Use fetch or axios for HTTP requests
     - Handle errors with try-catch
     - Return typed Promise results

  4. **Error Boundary Pattern:**
     - Use class components for error boundaries
     - Implement getDerivedStateFromError
     - Show fallback UI when errors occur
     - Wrap components that might throw errors
</code_generation_rules>`;
