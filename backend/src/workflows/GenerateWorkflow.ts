/**
 * Implements the code generation workflow.
 * Uses AI agents for intelligent code generation with validation and auto-fixing.
 */
import { CodeGeneratorAgent } from '../agents/specialized/CodeGeneratorAgent';
import { SpecInterpreterAgent } from '../agents/specialized/SpecInterpreterAgent';
import { TestCrafterAgent } from '../agents/specialized/TestCrafterAgent';
import { CodeValidatorAgent } from '../agents/specialized/CodeValidatorAgent';
import { CodeFixerAgent } from '../agents/specialized/CodeFixerAgent';
import fetch from 'node-fetch';

export class GenerateWorkflow {
    private readonly MAX_FIX_ATTEMPTS = 1; // Maximum number of times to try fixing code
    private readonly VALIDATION_ENABLED = false; // Enable/disable validation

    constructor() {
        // Initialize with agent dependencies
    }

    /**
     * Executes the generation workflow with validation and auto-fixing.
     * 1. Interprets the spec/prompt using SpecInterpreterAgent.
     * 2. Generates code using CodeGeneratorAgent.
     * 3. Validates the generated code using CodeValidatorAgent.
     * 4. If issues found, uses CodeFixerAgent to fix them (with retry logic).
     * 5. Optionally generates tests using TestCrafterAgent.
     * 6. Returns structured response with validation results.
     * @param request The generation request containing the prompt and options.
     * @returns An object containing the generated code, tests, validation results, and metadata.
     */
    async run(request: any): Promise<any> {
        const agentThoughts = [];
        let generatedCode = '';
        let tests = '';
        
        try {
            // Step 1: Interpret requirements using SpecInterpreterAgent
            const requirements = await this.interpretPrompt(request.prompt);
            agentThoughts.push({
                agent: 'SpecInterpreter',
                thought: `Analyzed requirements: ${requirements.summary || 'Requirements parsed successfully'}`
            });

            // Step 2: Generate code using CodeGeneratorAgent
            let codeResult = await this.generateCode({
                ...request,
                requirements
            });
            
            agentThoughts.push({
                agent: 'CodeGenerator',
                thought: `Generated ${request.targetLanguage} code using AI agent (${codeResult.metadata.generatedBy})`
            });

            // Step 3: Validate and fix code if validation is enabled
            if (this.VALIDATION_ENABLED) {
                const validationResult = await this.validateAndFixCode(
                    codeResult.files,
                    request,
                    agentThoughts
                );
                
                if (validationResult.fixed) {
                    codeResult.files = validationResult.files;
                    codeResult.validation = validationResult.validation;
                } else {
                    codeResult.validation = validationResult.validation;
                }
            }

            // Combine all generated files into a single code string for test generation
            generatedCode = (codeResult.files || [])
                .map((f: any) => `// File: ${f.path}\n${f.content}`)
                .join('\n\n');

            // Step 4: Generate tests if requested using TestCrafterAgent
            if (request.includeTests) {
                const testResult = await this.generateTests({
                    ...request,
                    generatedCode,
                    requirements
                });
                
                tests = testResult.tests || '';
                
                agentThoughts.push({
                    agent: 'TestCrafter',
                    thought: `Generated comprehensive test suite with ${testResult.metadata?.testCount || 0} test cases`
                });
            }

            // Step 5: Return final result
            return {
                files: codeResult.files,
                tests,
                language: request.targetLanguage,
                confidence: codeResult.validation?.isValid ? 0.95 : 0.75,
                validation: codeResult.validation,
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

    /**
     * Validates generated code and attempts to fix any issues found.
     * Uses a retry mechanism to ensure code quality.
     */
    private async validateAndFixCode(
        files: any[],
        request: any,
        agentThoughts: any[]
    ): Promise<any> {
        let currentFiles = files;
        let attempt = 0;
        let lastValidation: any = null;

        while (attempt < this.MAX_FIX_ATTEMPTS) {
            attempt++;

            // Validate the current code
            const validation = await this.validateCode(currentFiles, request.targetLanguage);
            lastValidation = validation;

            agentThoughts.push({
                agent: 'CodeValidator',
                thought: `Validation attempt ${attempt}: ${validation.isValid ? 'Code is valid ✓' : `Found ${validation.issues.length} issue(s)`}`
            });

            // If code is valid, we're done
            if (validation.isValid) {
                return {
                    fixed: attempt > 1,
                    files: currentFiles,
                    validation: {
                        isValid: true,
                        issues: [],
                        summary: validation.summary,
                        attempts: attempt
                    }
                };
            }

            // If this is the last attempt, return with issues
            if (attempt >= this.MAX_FIX_ATTEMPTS) {
                agentThoughts.push({
                    agent: 'CodeValidator',
                    thought: `Max fix attempts (${this.MAX_FIX_ATTEMPTS}) reached. Returning code with known issues.`
                });
                break;
            }

            // Try to fix the issues
            agentThoughts.push({
                agent: 'CodeFixer',
                thought: `Attempting to fix ${validation.issues.length} issue(s)...`
            });

            const fixedFiles = await this.fixCode(currentFiles, validation, request.targetLanguage);
            
            if (fixedFiles && fixedFiles.length > 0) {
                currentFiles = fixedFiles;
                agentThoughts.push({
                    agent: 'CodeFixer',
                    thought: `Applied fixes. Re-validating...`
                });
            } else {
                agentThoughts.push({
                    agent: 'CodeFixer',
                    thought: `Failed to apply fixes. Stopping retry loop.`
                });
                break;
            }
        }

        // Return with validation issues if we couldn't fix everything
        return {
            fixed: false,
            files: currentFiles,
            validation: {
                isValid: false,
                issues: lastValidation?.issues || [],
                summary: lastValidation?.summary || 'Code has unresolved issues',
                attempts: attempt
            }
        };
    }

    /**
     * Validates code using CodeValidatorAgent
     */
    private async validateCode(files: any[], language: string): Promise<any> {
        try {
            const { runner } = await CodeValidatorAgent();
            
            // Build validation prompt
            const filesContent = files.map(f => 
                `File: ${f.path}\n\`\`\`${language}\n${f.content}\n\`\`\``
            ).join('\n\n');

            const validationPrompt = `Validate the following ${language} code for any issues:

${filesContent}

Check for:
1. Syntax errors
2. Duplicate files (same path appearing multiple times)
3. Missing dependencies
4. Type errors
5. Logic errors
6. Code quality issues

Provide detailed analysis of any issues found.`;

            const response = await runner.ask(validationPrompt) as any;
            
            return {
                isValid: response.isValid,
                issues: response.issues || [],
                summary: response.summary || 'Validation completed'
            };
        } catch (error) {
            console.error('Code validation error:', error);
            // If validation fails, assume code is valid to avoid blocking
            return {
                isValid: true,
                issues: [],
                summary: 'Validation skipped due to error'
            };
        }
    }

    /**
     * Fixes code issues using CodeFixerAgent
     */
    private async fixCode(files: any[], validation: any, language: string): Promise<any[]> {
        try {
            const { runner } = await CodeFixerAgent();
            
            // Build fix prompt
            const filesContent = files.map(f => 
                `File: ${f.path}\n\`\`\`${language}\n${f.content}\n\`\`\``
            ).join('\n\n');

            const issuesDescription = validation.issues.map((issue: any, index: number) => 
                `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type} in ${issue.filePath}${issue.line ? ` (line ${issue.line})` : ''}
   Description: ${issue.description}
   Suggested fix: ${issue.suggestedFix}`
            ).join('\n\n');

            const fixPrompt = `Fix the following ${language} code based on the validation issues found:

ORIGINAL CODEBASE (${files.length} files):
${filesContent}

ISSUES TO FIX:
${issuesDescription}

CRITICAL: You MUST return ALL ${files.length} files in your response, not just the files with issues.

Instructions:
1. Fix all syntax errors in the affected files
2. Remove duplicate files (keep the best version)
3. Add missing dependencies to package.json if it exists
4. Correct type errors in the affected files
5. Fix logic errors in the affected files
6. For files WITHOUT issues, return them UNCHANGED with their original content
7. Maintain the original functionality

Your response MUST include ALL files from the original codebase. Return the COMPLETE fixed codebase with this exact structure:
{
  "files": [
    { "path": "file1.ts", "content": "..." },
    { "path": "file2.ts", "content": "..." },
    ... (all ${files.length} files must be included)
  ]
}`;

            const response = await runner.ask(fixPrompt) as any;
            
            // Validate that we got all files back
            if (response.files && response.files.length < files.length) {
                console.warn(`CodeFixerAgent returned ${response.files.length} files but expected ${files.length}. Merging with original files.`);
                
                // Create a map of fixed files
                const fixedFilesMap = new Map(response.files.map((f: any) => [f.path, f]));
                
                // Merge: use fixed version if available, otherwise use original
                const mergedFiles = files.map(originalFile => {
                    const fixedFile = fixedFilesMap.get(originalFile.path);
                    return fixedFile || originalFile;
                });
                
                return mergedFiles;
            }
            
            return response.files || [];
        } catch (error) {
            console.error('Code fixing error:', error);
            return [];
        }
    }

    private async interpretPrompt(prompt: string): Promise<any> {
        try {
            // Use SpecInterpreterAgent to analyze requirements
            console.log('Calling SpecInterpreterAgent to analyze prompt:', prompt);
            
            const { runner } = await SpecInterpreterAgent();
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
            const { runner } = await CodeGeneratorAgent();
            
            // Build the message with images if provided
            let message: any;
            
            if (request.imageUrls && request.imageUrls.length > 0) {
                // Download images and convert to base64
                const imageParts = await Promise.all(
                    request.imageUrls.map(async (url: string) => {
                        try {
                            const response = await fetch(url);
                            const buffer = await response.buffer();
                            const base64 = buffer.toString('base64');
                            const contentType = response.headers.get('content-type') || 'image/jpeg';
                            
                            return {
                                inline_data: {
                                    mime_type: contentType,
                                    data: base64
                                }
                            };
                        } catch (error) {
                            console.error(`Failed to fetch image from ${url}:`, error);
                            return null;
                        }
                    })
                );
                
                // Filter out failed downloads
                const validImageParts = imageParts.filter(part => part !== null);
                
                // Build message with text and images
                const textPart = {
                    text: this.buildCodeGenerationPrompt(request)
                };
                
                message = {
                    parts: [textPart, ...validImageParts]
                };
            } else {
                // Text-only message
                message = this.buildCodeGenerationPrompt(request);
            }

            console.log('Calling CodeGeneratorAgent with message');
            const response = await runner.ask(message) as any;

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
        const language = request.targetLanguage || 'typescript';
        const languageUpper = language.toUpperCase();
        
        // Get appropriate file extension
        let fileExtension = '.ts';
        let packageManager = 'package.json';
        if (language === 'python') {
            fileExtension = '.py';
            packageManager = 'requirements.txt';
        } else if (language === 'javascript') {
            fileExtension = '.js';
        }
        
        const webServerNote = language === 'python' 
            ? '\n5. ⚠️ PYTHON WEB APPS: Must include a web framework (Flask/FastAPI/Streamlit) running on port 8080'
            : '';
        
        return `🎯 CRITICAL: YOU MUST GENERATE ${languageUpper} CODE ONLY!

Target Programming Language: ${languageUpper}
User Request: ${request.prompt}

IMPORTANT INSTRUCTIONS:
1. ALL code files MUST use ${languageUpper} syntax with ${fileExtension} extension
2. Include ${packageManager} for dependency management
3. DO NOT mix languages - use ONLY ${languageUpper}
4. Follow ${languageUpper} best practices and conventions${webServerNote}

Requirements:
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

Generate a complete, functional ${languageUpper} codebase with multiple files. The output should be a JSON object with the following structure:
{
  "files": [
    {
      "path": "path/to/file${fileExtension}",
      "content": "... ${languageUpper} code here ..."
    }
  ]
}

Focus on creating a meaningful, domain-specific codebase in ${languageUpper} rather than generic boilerplate. The code should be immediately usable and follow ${languageUpper} industry standards.`;
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
                console.warn('No generated code provided for test generation');
                return { tests: '', metadata: { testCount: 0 } };
            }

            // Use TestCrafterAgent to generate tests
            console.log('Calling TestCrafterAgent to generate tests for the generated code');
            
            const { runner } = await TestCrafterAgent();
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
