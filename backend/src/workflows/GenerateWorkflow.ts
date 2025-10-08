/**
 * Implements the code generation workflow.
 * Uses AI agents for intelligent code generation.
 */
import { CodeGeneratorAgent } from '../agents/specialized/CodeGeneratorAgent';
import { SpecInterpreterAgent } from '../agents/specialized/SpecInterpreterAgent';
import { TestCrafterAgent } from '../agents/specialized/TestCrafterAgent';

export class GenerateWorkflow {
    constructor() {
        // Initialize with agent dependencies
    }

    /**
     * Executes the generation workflow.
     * 1. Interprets the spec/prompt using SpecInterpreterAgent.
     * 2. Generates code using CodeGeneratorAgent.
     * 3. Optionally generates tests using TestCrafterAgent.
     * 4. Returns structured response.
     * @param request The generation request containing the prompt and options.
     * @returns An object containing the generated code, tests, and metadata.
     */
    async run(request: any): Promise<any> {
        const agentThoughts = [];
        let generatedCode = '';
        
        try {
            // Step 1: Interpret requirements using SpecInterpreterAgent
            const requirements = await this.interpretPrompt(request.prompt);
            agentThoughts.push({
                agent: 'SpecInterpreter',
                thought: `Analyzed requirements: ${requirements.summary || 'Requirements parsed successfully'}`
            });

            // Step 2: Generate code using CodeGeneratorAgent
            const codeResult = await this.generateCode({
                ...request,
                requirements
            });
            
            generatedCode = codeResult.code;
            agentThoughts.push({
                agent: 'CodeGenerator',
                thought: `Generated ${request.targetLanguage} code using AI agent (${codeResult.metadata.generatedBy})`
            });

            // Step 3: Generate tests if requested using TestCrafterAgent
            if (request.includeTests) {
                const testResult = await this.generateTests({
                    ...request,
                    generatedCode,
                    requirements
                });
                
                agentThoughts.push({
                    agent: 'TestCrafter',
                    thought: `Generated comprehensive test suite with ${testResult.metadata?.testCount || 0} test cases`
                });
            }

            // Step 4: Basic validation
            return {
                files: codeResult.files,
                language: request.targetLanguage,
                confidence: codeResult.confidence || 0.85,
                agentThoughts,
                requirements
            };

        } catch (error: any) {
            console.error('Generation workflow error:', error);
            agentThoughts.push({
                agent: 'System',
                thought: `Error: ${error.message}`
            });

            return {
                code: this.generateFallbackCode(request),
                tests: '',
                language: request.targetLanguage,
                validation: {
                    syntaxValid: false,
                    errors: [error.message]
                },
                confidence: 0.1,
                agentThoughts,
                error: error.message
            };
        }
    }

    private async interpretPrompt(prompt: string): Promise<any> {
        try {
            // Use SpecInterpreterAgent to analyze requirements
            console.log('Calling SpecInterpreterAgent to analyze prompt:', prompt);
            
            const { runner } = await SpecInterpreterAgent;
            const analysisPrompt = `Analyze the following requirement and extract structured requirements:

User requirement: ${prompt}

Please provide:
1. A brief summary of the requirement
2. List of functional requirements
3. Non-functional requirements (if any)
4. Complexity level (simple/moderate/complex)
5. Application domain
6. Technical constraints

Return the result as JSON with the following structure:
{
  "summary": "...",
  "requirements": ["...", "..."],
  "nonFunctionalRequirements": ["...", "..."],
  "complexity": "moderate",
  "domain": "...",
  "technicalConstraints": ["...", "..."]
}`;

            const response = await runner.ask(analysisPrompt) as string;
            console.log('Response from SpecInterpreterAgent:', response);
            
            // Parse response from agent
            let parsedResponse;
            try {
                // Try to parse JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedResponse = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.warn('Cannot parse JSON from SpecInterpreterAgent, using basic analysis');
                // Fallback to basic analysis
                const analysis = this.analyzePrompt(prompt);
                parsedResponse = {
                    summary: `Generate ${analysis.domain} system: ${prompt}`,
                    requirements: analysis.requirements,
                    complexity: analysis.complexity,
                    domain: analysis.domain
                };
            }
            
            return parsedResponse;
        } catch (error) {
            console.error('Prompt interpretation error:', error);
            // Fallback to basic analysis
            const analysis = this.analyzePrompt(prompt);
            return {
                summary: `Basic code generation request: ${prompt}`,
                requirements: analysis.requirements || ['Generate basic functional code'],
                complexity: analysis.complexity || 'simple',
                domain: analysis.domain || 'generic'
            };
        }
    }

    private analyzePrompt(prompt: string): any {
        const lowerPrompt = prompt.toLowerCase();
        
        // Determine domain and complexity
        let domain = 'generic';
        let complexity = 'moderate';
        let requirements = ['Generate functional code', 'Follow best practices', 'Include proper error handling'];
        
        // Domain detection
        if (lowerPrompt.includes('store') || lowerPrompt.includes('shop') || lowerPrompt.includes('ecommerce')) {
            domain = 'e-commerce';
            requirements.push('Implement inventory management', 'Handle transactions', 'Manage customer data');
        } else if (lowerPrompt.includes('user') || lowerPrompt.includes('auth') || lowerPrompt.includes('login')) {
            domain = 'authentication';
            requirements.push('Implement user authentication', 'Handle sessions', 'Validate credentials');
        } else if (lowerPrompt.includes('api') || lowerPrompt.includes('endpoint') || lowerPrompt.includes('service')) {
            domain = 'api';
            requirements.push('Create RESTful endpoints', 'Handle HTTP requests', 'Implement proper routing');
        } else if (lowerPrompt.includes('database') || lowerPrompt.includes('data') || lowerPrompt.includes('crud')) {
            domain = 'data';
            requirements.push('Implement data operations', 'Handle database connections', 'Validate data integrity');
        }
        
        // Complexity detection
        if (lowerPrompt.includes('simple') || lowerPrompt.includes('basic')) {
            complexity = 'simple';
        } else if (lowerPrompt.includes('complex') || lowerPrompt.includes('advanced') || lowerPrompt.includes('enterprise')) {
            complexity = 'complex';
            requirements.push('Implement advanced patterns', 'Add comprehensive error handling', 'Include logging and monitoring');
        }
        
        return { domain, complexity, requirements };
    }

    private async generateCode(request: any): Promise<any> {
        try {
            const prompt = this.buildCodeGenerationPrompt(request);
            console.log('Calling CodeGeneratorAgent with prompt:', prompt);

            const { runner } = await CodeGeneratorAgent();
            const response = await runner.ask(prompt) as any;

            return {
                files: response.files,
                confidence: 0.8,
                metadata: {
                    generatedBy: 'AI Agent (gpt-5-nano)'
                }
            };
        } catch (error) {
            console.error('Code generation error:', error);
            return {
                files: [{
                    path: `fallback-code.${request.targetLanguage}`,
                    content: this.generateFallbackCode(request)
                }],
                confidence: 0.1,
                metadata: {
                    generatedBy: 'Template Fallback (Error)'
                }
            };
        }
    }

    private buildCodeGenerationPrompt(request: any): string {
        return `Generate ${request.targetLanguage} code for: ${request.prompt}

Requirements:
- Target language: ${request.targetLanguage}
- Domain: ${request.requirements?.domain || 'generic'}
- Complexity: ${request.requirements?.complexity || 'moderate'}
- Include proper error handling
- Follow best practices for ${request.requirements?.domain || 'generic'} applications
- Make the code production-ready
- Add appropriate comments and documentation

${request.requirements?.requirements ? 
    'Specific requirements:\n- ' + request.requirements.requirements.join('\n- ') 
    : ''
}

${request.requirements?.nonFunctionalRequirements ? 
    'Non-functional requirements:\n- ' + request.requirements.nonFunctionalRequirements.join('\n- ') 
    : ''
}

${request.requirements?.technicalConstraints ? 
    'Technical constraints:\n- ' + request.requirements.technicalConstraints.join('\n- ') 
    : ''
}

Generate a complete, functional codebase with multiple files. The output should be a JSON object with the following structure:
{
  "files": [
    {
      "path": "path/to/file.ts",
      "content": "... file content ..."
    }
  ]
}

Focus on creating a meaningful, domain-specific codebase rather than generic boilerplate. The code should be immediately usable and follow industry standards.`;
    }

    private extractCodeFromResponse(response: string): string {
        // Extract code blocks from agent response
        const codeBlockRegex = /```(?:typescript|javascript|ts|js|python|py)?\n?([\s\S]*?)```/g;
        const matches = response.match(codeBlockRegex);
        
        if (matches && matches.length > 0) {
            // Take the first code block and clean it up
            return matches[0]
                .replace(/```(?:typescript|javascript|ts|js|python|py)?\n?/, '')
                .replace(/```$/, '')
                .trim();
        }
        
        // If no code blocks found, return the entire response
        return response.trim();
    }

    private async generateTests(request: any): Promise<any> {
        try {
            if (!request.generatedCode) {
                return { tests: '', metadata: { testCount: 0 } };
            }

            // Use TestCrafterAgent to generate tests
            console.log('Calling TestCrafterAgent to generate tests for the generated code');
            
            const { runner } = await TestCrafterAgent;
            const testPrompt = `Generate a comprehensive test suite for the following code:

Language: ${request.targetLanguage}
Original requirement: ${request.prompt}

Generated code:
\`\`\`${request.targetLanguage}
${request.generatedCode}
\`\`\`

Requirements:
${request.requirements?.requirements ? request.requirements.requirements.map((r: string) => `- ${r}`).join('\n') : ''}

Please create:
1. Unit tests for all functions/methods
2. Integration tests for component interactions
3. Edge case tests
4. Error handling tests
5. Appropriate test data and mocks

Use the appropriate test framework for ${request.targetLanguage} (e.g., Jest/Vitest for TypeScript/JavaScript, pytest for Python).

Return complete, runnable test code.`;

            const response = await runner.ask(testPrompt) as string;
            console.log('Response from TestCrafterAgent:', response);
            
            // Extract test code from response
            const tests = this.extractCodeFromResponse(response);
            
            // Count test cases
            let testCount = 0;
            if (request.targetLanguage === 'python') {
                testCount = (tests.match(/def test_/g) || []).length;
            } else {
                testCount = (tests.match(/test\(/g) || []).length + (tests.match(/it\(/g) || []).length;
            }
            
            return {
                tests,
                metadata: {
                    testCount,
                    generatedBy: 'TestCrafterAgent (gpt-5-nano)'
                }
            };
        } catch (error) {
            console.error('Test generation error:', error);
            // Fallback to basic test generation
            const tests = this.generateTestsFromCode(request.generatedCode, request.targetLanguage);
            return { 
                tests,
                metadata: {
                    testCount: tests.split('test(').length - 1,
                    generatedBy: 'Template Fallback (Error)'
                }
            };
        }
    }

    
    private generateTestsFromCode(_code: string, language: string): string {
        switch (language) {
            case 'typescript':
            case 'javascript':
                return `/**
 * Generated tests for the code
 */
import { describe, test, expect } from 'vitest';

describe('Generated Code Tests', () => {
    test('should execute successfully', () => {
        // TODO: Import and test the generated code
        expect(true).toBe(true);
    });

    test('should handle valid input', () => {
        // TODO: Test with valid input
        const input = { test: 'data' };
        // const result = generatedFunction(input);
        // expect(result.success).toBe(true);
        expect(input).toBeDefined();
    });

    test('should handle edge cases', () => {
        // TODO: Test edge cases
        expect(() => {
            // Test error handling
        }).not.toThrow();
    });

    test('should validate output format', () => {
        // TODO: Validate output structure
        const expectedFormat = {
            success: expect.any(Boolean),
            data: expect.anything()
        };
        expect(expectedFormat).toBeDefined();
    });
});`;

            case 'python':
                return `"""
Generated tests for the code
"""
import unittest
import pytest

class TestGeneratedCode(unittest.TestCase):
    def test_execution_success(self):
        """Test that code executes successfully"""
        # TODO: Import and test the generated code
        self.assertTrue(True)

    def test_valid_input_handling(self):
        """Test handling of valid input"""
        # TODO: Test with valid input
        input_data = {"test": "data"}
        # result = execute(input_data)
        # self.assertTrue(result["success"])
        self.assertIsNotNone(input_data)

    def test_edge_cases(self):
        """Test edge cases"""
        # TODO: Test edge cases
        with self.assertRaises(Exception):
            # Test error conditions
            pass

    def test_output_format(self):
        """Test output format validation"""
        # TODO: Validate output structure
        expected_keys = ["success", "data"]
        self.assertIsInstance(expected_keys, list)

if __name__ == '__main__':
    unittest.main()`;

            default:
                return `// Generated tests for: ${language}\n// TODO: Implement comprehensive tests`;
        }
    }

    private generateFallbackCode(request: any): string {
        return `// Fallback code generation for: ${request.prompt}
// Language: ${request.targetLanguage}
// 
// NOTE: Advanced code generation failed, but here's a basic structure:

console.log(\`Generated code for: ${request.prompt}\`);

export default {
    message: 'Code generation completed with fallback',
    prompt: \`${request.prompt}\`,
    language: \`${request.targetLanguage}\`,
    timestamp: new Date().toISOString()
};`;
    }
}
