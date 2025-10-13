/**
 * Tests for ADK Template Variable Escaping
 */

import { 
  escapeAdkTemplateVariables, 
  escapeAdkTemplateVariablesBulk,
  escapeAdkTemplateVariablesInObject 
} from '../adkEscaping';

describe('ADK Template Variable Escaping', () => {
  describe('escapeAdkTemplateVariables', () => {
    it('should escape single identifier in curly braces', () => {
      expect(escapeAdkTemplateVariables('{ProductDetailPage}')).toBe('{{ProductDetailPage}}');
      expect(escapeAdkTemplateVariables('{id}')).toBe('{{id}}');
      expect(escapeAdkTemplateVariables('{count}')).toBe('{{count}}');
    });

    it('should escape multiple identifiers', () => {
      const input = 'import { ProductDetailPage } from "./pages/ProductDetail"';
      const expected = 'import {{ ProductDetailPage }} from "./pages/ProductDetail"';
      expect(escapeAdkTemplateVariables(input)).toBe(expected);
    });

    it('should escape identifiers in error messages', () => {
      const input = `✘ [ERROR] No matching export in "src/pages/ProductDetail.tsx" for import "ProductDetailPage"

    src/App.tsx:4:9:
      4 │ import { ProductDetailPage } from './pages/ProductDetail';
        ╵          ~~~~~~~~~~~~~~~~~`;
      
      const result = escapeAdkTemplateVariables(input);
      expect(result).toContain('{{ ProductDetailPage }}');
      expect(result).not.toContain('{ ProductDetailPage }');
    });

    it('should not escape double curly braces', () => {
      expect(escapeAdkTemplateVariables('{{alreadyEscaped}}')).toBe('{{alreadyEscaped}}');
    });

    it('should not escape non-identifier patterns', () => {
      expect(escapeAdkTemplateVariables('{123}')).toBe('{123}');
      expect(escapeAdkTemplateVariables('{-invalid}')).toBe('{-invalid}');
      expect(escapeAdkTemplateVariables('{with space}')).toBe('{with space}');
    });

    it('should handle empty/null input', () => {
      expect(escapeAdkTemplateVariables('')).toBe('');
      expect(escapeAdkTemplateVariables(null as any)).toBe(null);
      expect(escapeAdkTemplateVariables(undefined as any)).toBe(undefined);
    });

    it('should escape React component destructuring', () => {
      const input = 'const { user, setUser } = useContext(UserContext);';
      const expected = 'const {{ user, setUser }} = useContext(UserContext);';
      expect(escapeAdkTemplateVariables(input)).toBe(expected);
    });
  });

  describe('escapeAdkTemplateVariablesBulk', () => {
    it('should escape array of strings', () => {
      const input = ['{id}', '{name}', '{count}'];
      const expected = ['{{id}}', '{{name}}', '{{count}}'];
      expect(escapeAdkTemplateVariablesBulk(input)).toEqual(expected);
    });
  });

  describe('escapeAdkTemplateVariablesInObject', () => {
    it('should escape string values in object', () => {
      const input = {
        message: 'Error in {ProductDetailPage}',
        file: 'src/App.tsx',
        line: 4
      };
      const result = escapeAdkTemplateVariablesInObject(input);
      expect(result.message).toBe('Error in {{ProductDetailPage}}');
      expect(result.file).toBe('src/App.tsx');
      expect(result.line).toBe(4);
    });

    it('should escape nested objects', () => {
      const input = {
        error: {
          message: 'Cannot find {ProductDetailPage}',
          details: {
            file: '{App.tsx}'
          }
        }
      };
      const result = escapeAdkTemplateVariablesInObject(input);
      expect(result.error.message).toBe('Cannot find {{ProductDetailPage}}');
      expect(result.error.details.file).toBe('{{App.tsx}}');
    });

    it('should escape arrays in objects', () => {
      const input = {
        files: [
          { path: 'App.tsx', content: 'import { Component } from "react"' }
        ]
      };
      const result = escapeAdkTemplateVariablesInObject(input);
      expect(result.files[0].content).toBe('import {{ Component }} from "react"');
    });
  });
});
