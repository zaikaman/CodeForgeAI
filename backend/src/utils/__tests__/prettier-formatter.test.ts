/**
 * Test suite for Prettier formatter utility
 */

import { formatCodeFile, formatCodeFiles, shouldFormatFile } from '../prettier-formatter';

describe('Prettier Formatter', () => {
  describe('shouldFormatFile', () => {
    it('should format TypeScript files', () => {
      expect(shouldFormatFile('src/App.tsx')).toBe(true);
      expect(shouldFormatFile('src/utils/helper.ts')).toBe(true);
    });

    it('should format JavaScript files', () => {
      expect(shouldFormatFile('src/main.js')).toBe(true);
      expect(shouldFormatFile('config.mjs')).toBe(true);
    });

    it('should format JSON files', () => {
      expect(shouldFormatFile('package.json')).toBe(true);
      expect(shouldFormatFile('tsconfig.json')).toBe(true);
    });

    it('should skip .gitignore files', () => {
      expect(shouldFormatFile('.gitignore')).toBe(false);
    });

    it('should skip .env files', () => {
      expect(shouldFormatFile('.env')).toBe(false);
      expect(shouldFormatFile('.env.example')).toBe(false);
    });

    it('should skip Dockerfile', () => {
      expect(shouldFormatFile('Dockerfile')).toBe(false);
    });

    it('should skip .lock files', () => {
      expect(shouldFormatFile('pnpm-lock.yaml')).toBe(false);
      expect(shouldFormatFile('package-lock.json')).toBe(false);
    });
  });

  describe('formatCodeFile', () => {
    it('should format single-line TypeScript code', async () => {
      const singleLine = "import React from 'react'; export default function App() { return <div>Hello</div>; }";
      const formatted = await formatCodeFile('App.tsx', singleLine);
      
      expect(formatted).toContain('\n'); // Should have line breaks after formatting
      expect(formatted).toContain('import React');
      expect(formatted).toContain('export default function App()');
    });

    it('should format single-line JavaScript code', async () => {
      const singleLine = "const x = 1; function foo() { return x + 1; } export default foo;";
      const formatted = await formatCodeFile('main.js', singleLine);
      
      expect(formatted).toContain('\n'); // Should have line breaks after formatting
      expect(formatted).toContain('const x = 1;');
      expect(formatted).toContain('function foo()');
    });

    it('should format JSON with proper indentation', async () => {
      const singleLine = '{"name":"app","version":"1.0.0","scripts":{"dev":"vite"}}';
      const formatted = await formatCodeFile('package.json', singleLine);
      
      expect(formatted).toContain('\n'); // Should have line breaks
      expect(formatted).toContain('  '); // Should have indentation
    });

    it('should handle CSS files', async () => {
      const singleLine = "body { margin: 0; padding: 0; font-family: Arial; }";
      const formatted = await formatCodeFile('styles.css', singleLine);
      
      expect(formatted).toContain('\n');
      expect(formatted).toContain('body');
    });

    it('should return original content for unknown file types', async () => {
      const content = "Some random text content";
      const formatted = await formatCodeFile('README.txt', content);
      
      expect(formatted).toBe(content);
    });

    it('should handle formatting errors gracefully', async () => {
      const invalidCode = "import React from 'react'; this is invalid syntax <<<";
      const formatted = await formatCodeFile('App.tsx', invalidCode);
      
      // Should return original content if formatting fails
      expect(formatted).toBe(invalidCode);
    });
  });

  describe('formatCodeFiles', () => {
    it('should format multiple files', async () => {
      const files = [
        {
          path: 'src/App.tsx',
          content: "import React from 'react'; export default function App() { return <div>Hello</div>; }",
        },
        {
          path: 'src/main.tsx',
          content: "import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')).render(<App />);",
        },
      ];

      const formatted = await formatCodeFiles(files);
      
      expect(formatted).toHaveLength(2);
      expect(formatted[0].path).toBe('src/App.tsx');
      expect(formatted[0].content).toContain('\n');
      expect(formatted[1].path).toBe('src/main.tsx');
      expect(formatted[1].content).toContain('\n');
    });

    it('should handle empty files array', async () => {
      const formatted = await formatCodeFiles([]);
      expect(formatted).toHaveLength(0);
    });
  });
});
