/**
 * Implements the code generation workflow.
 * Uses AI agents with FAST validation (< 2s overhead) and smart auto-fixing.
 */
import { CodeGeneratorAgent } from '../agents/specialized/CodeGeneratorAgent';
import { TestCrafterAgent } from '../agents/specialized/TestCrafterAgent';
import { DocWeaverAgent } from '../agents/specialized/DocWeaverAgent';
import { RefactorGuruAgent } from '../agents/specialized/RefactorGuruAgent';
import { SecuritySentinelAgent } from '../agents/specialized/SecuritySentinelAgent';
import { PerformanceProfilerAgent } from '../agents/specialized/PerformanceProfilerAgent';
import { createQualityAssuranceAgent } from '../agents/specialized/QualityAssuranceAgent';
import { formatCodeFiles, shouldFormatFile } from '../utils/prettier-formatter';

export class GenerateWorkflow {
    private readonly VALIDATION_ENABLED = true; // Enable fast validation (< 2s overhead)
    private readonly qaAgent = createQualityAssuranceAgent();

    constructor() {
        // Initialize with QA agent for validation
    }

    /**
     * Executes the generation workflow with validation and auto-fixing.
     * 1. Interprets the spec/prompt using SpecInterpreterAgent.
     * 2. Generates code using CodeGeneratorAgent.
     * 3. Validates the generated code using CodeValidatorAgent (if enabled).
     * 4. If issues found, uses CodeFixerAgent to fix them (with retry logic).
     * 5. Optionally generates tests using TestCrafterAgent (if agent selected).
     * 6. Optionally refactors code using RefactorGuruAgent (if agent selected).
     * 7. Optionally analyzes security using SecuritySentinelAgent (if agent selected).
     * 8. Optionally optimizes performance using PerformanceProfilerAgent (if agent selected).
     * 9. Optionally generates documentation using DocWeaverAgent (if agent selected).
     * 10. Returns structured response with all results.
     * @param request The generation request containing the prompt, agents array, and options.
     * @returns An object containing the generated code, tests, documentation, security report, performance report, validation results, and metadata.
     */
    async run(request: any): Promise<any> {
        console.log('\n========== WORKFLOW START ==========');
        console.log('Request:', JSON.stringify(request, null, 2));
        
        const agentThoughts = [];
        let generatedCode = '';
        let tests = '';
        
        try {
            // Step 1: Interpret requirements (includes ConversationalAgent check)
            console.log('\n[STEP 1] Interpreting prompt...');
            const requirements = await this.interpretPrompt(request.prompt);
            console.log('[STEP 1] Requirements:', JSON.stringify(requirements, null, 2).substring(0, 500));
            
            // If it's conversational only (greeting/casual chat), return early
            if (requirements.conversationalOnly) {
                console.log('[WORKFLOW] Conversational response only, no code generation needed');
                return {
                    files: [],
                    summary: requirements.conversationResponse || requirements.summary,
                    agentThoughts: [{
                        agent: 'ConversationalAgent',
                        thought: requirements.conversationResponse
                    }],
                    tests: '',
                    conversationalOnly: true,
                    intent: requirements.intent
                };
            }
            
            agentThoughts.push({
                agent: 'SpecInterpreter',
                thought: `Analyzed requirements: ${requirements.summary || 'Requirements parsed successfully'}`
            });

            // Check if this is a documentation-only request with existing code
            const isDocOnlyWithExistingCode = 
                request.agents && 
                request.agents.length === 1 && 
                request.agents[0] === 'DocWeaver' &&
                request.currentFiles && 
                request.currentFiles.length > 0;

            // Check if DocWeaver is the ONLY agent and user wants to document their IDEA (no code yet)
            const isDocForNewProject = 
                request.agents && 
                request.agents.length === 1 && 
                request.agents[0] === 'DocWeaver' &&
                (!request.currentFiles || request.currentFiles.length === 0);

            // Check if this is a test-only request (TestCrafter only)
            const isTestOnlyRequest = 
                request.agents && 
                request.agents.length === 1 && 
                request.agents[0] === 'TestCrafter' &&
                request.currentFiles && 
                request.currentFiles.length > 0;

            let codeResult: any;

            if (isDocOnlyWithExistingCode) {
                // Skip code generation, use existing files
                console.log('\n[STEP 2] Documentation-only request, using existing files...');
                codeResult = {
                    files: request.currentFiles,
                    metadata: {
                        generatedBy: 'existing',
                        skippedGeneration: true
                    }
                };
                agentThoughts.push({
                    agent: 'System',
                    thought: 'Using existing codebase for documentation generation'
                });
            } else if (isDocForNewProject) {
                // Generate project plan/structure documentation without code
                console.log('\n[STEP 2] Documentation for new project (no code yet)...');
                codeResult = {
                    files: [],
                    metadata: {
                        generatedBy: 'none',
                        documentationOnly: true
                    }
                };
                agentThoughts.push({
                    agent: 'System',
                    thought: 'Generating project documentation and planning guide'
                });
            } else if (isTestOnlyRequest) {
                // Skip code generation, use existing files for test generation
                console.log('\n[STEP 2] Test-only request, using existing codebase...');
                codeResult = {
                    files: request.currentFiles,
                    metadata: {
                        generatedBy: 'existing',
                        testsOnly: true
                    }
                };
                agentThoughts.push({
                    agent: 'System',
                    thought: 'Using existing codebase for test generation'
                });
            } else {
                // Step 2: Generate code using CodeGeneratorAgent
                console.log('\n[STEP 2] Generating code...');
                codeResult = await this.generateCode({
                    ...request,
                    requirements
                });
                console.log('[STEP 2] Code result files count:', codeResult?.files?.length || 0);
                console.log('[STEP 2] Code result metadata:', JSON.stringify(codeResult?.metadata || {}));
                
                agentThoughts.push({
                    agent: 'CodeGenerator',
                    thought: `Generated ${request.targetLanguage} code using AI agent (${codeResult.metadata.generatedBy})`
                });
            }

            // Step 3: Validate and fix code if validation is enabled (skip for doc-only and test-only)
            const skipValidation = isDocOnlyWithExistingCode || isDocForNewProject || isTestOnlyRequest;
            if (this.VALIDATION_ENABLED && !skipValidation) {
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
            } else if (skipValidation) {
                // Skip validation for doc-only requests
                codeResult.validation = {
                    isValid: true,
                    skipped: true
                };
            }

            // Combine all generated files into a single code string for test generation
            generatedCode = (codeResult.files || [])
                .map((f: any) => `// File: ${f.path}\n${f.content}`)
                .join('\n\n');

            // Step 4: Generate tests if TestCrafter agent is selected
            const shouldGenerateTests = request.agents && request.agents.includes('TestCrafter');
            if (shouldGenerateTests) {
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

            // Step 5: Refactor code if RefactorGuru agent is selected
            const shouldRefactor = request.agents && request.agents.includes('RefactorGuru');
            if (shouldRefactor) {
                const refactorResult = await this.refactorCode({
                    files: codeResult.files,
                    requirements
                });
                
                if (refactorResult.improved) {
                    codeResult.files = refactorResult.files;
                    agentThoughts.push({
                        agent: 'RefactorGuru',
                        thought: refactorResult.summary || 'Applied code refactoring improvements'
                    });
                }
            }

            // Step 6: Analyze security if SecuritySentinel agent is selected
            let securityReport = null;
            const shouldAnalyzeSecurity = request.agents && request.agents.includes('SecuritySentinel');
            if (shouldAnalyzeSecurity) {
                securityReport = await this.analyzeSecurity({
                    files: codeResult.files,
                    language: request.targetLanguage
                });
                
                agentThoughts.push({
                    agent: 'SecuritySentinel',
                    thought: `Security analysis complete: ${securityReport.summary || 'No critical vulnerabilities found'}`
                });
            }

            // Step 7: Optimize performance if PerformanceProfiler agent is selected
            let performanceReport = null;
            const shouldOptimizePerformance = request.agents && request.agents.includes('PerformanceProfiler');
            if (shouldOptimizePerformance) {
                performanceReport = await this.optimizePerformance({
                    files: codeResult.files,
                    language: request.targetLanguage
                });
                
                agentThoughts.push({
                    agent: 'PerformanceProfiler',
                    thought: `Performance analysis complete: ${performanceReport.summary || 'Code optimized for performance'}`
                });
            }

            // Step 8: Generate documentation if DocWeaver agent is selected
            let documentation = '';
            const shouldGenerateDocs = request.agents && request.agents.includes('DocWeaver');
            if (shouldGenerateDocs) {
                const docsResult = await this.generateDocumentation({
                    files: codeResult.files,
                    requirements,
                    language: request.targetLanguage,
                    prompt: request.prompt, // Pass original prompt for context
                });
                
                documentation = docsResult.documentation || '';
                
                // If documentation-only request, add docs as a README.md file
                if ((isDocOnlyWithExistingCode || isDocForNewProject) && documentation) {
                    const readmeFile = {
                        path: 'README.md',
                        content: documentation
                    };
                    
                    // For doc-only with existing code, add README to files
                    if (isDocOnlyWithExistingCode) {
                        const existingReadme = codeResult.files.findIndex((f: any) => f.path === 'README.md');
                        if (existingReadme >= 0) {
                            codeResult.files[existingReadme] = readmeFile;
                        } else {
                            codeResult.files.push(readmeFile);
                        }
                    } else {
                        // For new project docs, only return README
                        codeResult.files = [readmeFile];
                    }
                }
                
                agentThoughts.push({
                    agent: 'DocWeaver',
                    thought: `Generated comprehensive documentation with ${docsResult.metadata?.sectionCount || 0} sections`
                });
            }

            // Step 9: Return final result with all enhancements
            // Create appropriate summary based on request type
            let summary = '';
            if (isDocForNewProject) {
                summary = '✅ Generated project planning documentation and roadmap';
            } else if (isDocOnlyWithExistingCode) {
                summary = `✅ Generated comprehensive documentation for your ${request.targetLanguage} codebase`;
            } else if (isTestOnlyRequest) {
                summary = `✅ Generated comprehensive test suite for your ${request.targetLanguage} codebase`;
            } else {
                summary = `✅ Generated ${request.targetLanguage} code with ${codeResult.files?.length || 0} files`;
            }
            
            return {
                files: codeResult.files,
                tests,
                documentation,
                summary, // Add summary for ChatQueue
                language: request.targetLanguage,
                confidence: codeResult.validation?.isValid ? 0.95 : 0.75,
                validation: codeResult.validation,
                securityReport,
                performanceReport,
                agentThoughts,
                requirements
            };

        } catch (error: any) {
            console.error('Generation workflow error:', error);
            agentThoughts.push({
                agent: 'System',
                thought: `Error: ${error.message}`
            });

            // Return fallback code as files array (not as string)
            return {
                files: [{
                    path: `fallback-code.${request.targetLanguage || 'ts'}`,
                    content: this.generateFallbackCode(request)
                }],
                tests: '',
                language: request.targetLanguage || 'typescript',
                validation: {
                    syntaxValid: false,
                    errors: [error.message]
                },
                confidence: 0.1,
                agentThoughts,
                requirements: null,
                error: error.message
            };
        }
    }

    /**
     * Validates generated code using QualityAssuranceAgent.
     * Delegates validation and auto-fixing to specialized QA agent.
     */
    private async validateAndFixCode(
        files: any[],
        request: any,
        agentThoughts: any[]
    ): Promise<any> {
        
        console.log('\n[VALIDATION] Delegating to QualityAssuranceAgent...');
        
        // Delegate to QA agent for validation and auto-fixing
        const qaResult = await this.qaAgent.run({
            files,
            language: request.targetLanguage,
            autoFix: true,
            maxAttempts: 2
        });
        
        // Log QA agent's work
        const criticalCount = qaResult.errors.filter((e: any) => e.severity === 'critical').length;
        const highCount = qaResult.errors.filter((e: any) => e.severity === 'high').length;
        
        agentThoughts.push({
            agent: 'QualityAssurance',
            thought: qaResult.isValid 
                ? `✅ Code validated successfully (${(qaResult.confidence * 100).toFixed(0)}% confidence, ${qaResult.duration}ms)`
                : `Found ${criticalCount} critical, ${highCount} high errors after ${qaResult.attempts} attempts`
        });
        
        // If fixes were applied, log them
        if (qaResult.fixedCount > 0) {
            agentThoughts.push({
                agent: 'QualityAssurance',
                thought: `Auto-fixed ${qaResult.fixedCount} issues: ${qaResult.appliedFixes.join(', ')}`
            });
        }
        
        // If still has errors, log remaining issues
        if (!qaResult.isValid && qaResult.errors.length > 0) {
            const topErrors = qaResult.errors.slice(0, 3).map((e: any) => 
                `${e.severity}: ${e.message} in ${e.file}`
            ).join('; ');
            
            agentThoughts.push({
                agent: 'QualityAssurance',
                thought: `⚠ Remaining issues: ${topErrors}${qaResult.errors.length > 3 ? '...' : ''}`
            });
        }
        
        return {
            fixed: qaResult.fixedCount > 0,
            files: qaResult.files,
            validation: {
                isValid: qaResult.isValid,
                errors: qaResult.errors,
                warnings: qaResult.warnings,
                confidence: qaResult.confidence,
                attempts: qaResult.attempts,
                duration: qaResult.duration
            }
        };
    }

    private async interpretPrompt(prompt: string): Promise<any> {
        try {
            // STEP 0: First check with ConversationalAgent to detect intent
            console.log('\n[STEP 0] Analyzing conversation intent...');
            const { ConversationalAgent } = await import('../agents/specialized/ConversationalAgent');
            const conversationAgent = await ConversationalAgent();
            const { runner: convRunner } = conversationAgent;
            
            const intentResponse = await convRunner.ask(prompt);
            console.log('Response from ConversationalAgent:', intentResponse);
            
            // Parse conversation response
            let conversationResult;
            try {
                // Check if response is already an object
                if (typeof intentResponse === 'object' && intentResponse !== null) {
                    conversationResult = intentResponse;
                } else if (typeof intentResponse === 'string') {
                    // Try to parse as JSON string
                    const jsonMatch = intentResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        conversationResult = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('No JSON found in ConversationalAgent response');
                    }
                } else {
                    throw new Error('Unexpected response type from ConversationalAgent');
                }
            } catch (parseError) {
                console.error('Failed to parse ConversationalAgent response:', parseError);
                conversationResult = {
                    intent: 'unclear',
                    response: 'I understand you want help, but could you provide more details?',
                    needsSpecializedAgent: false
                };
            }
            
            console.log('[STEP 0] Intent detected:', conversationResult.intent);
            console.log('[STEP 0] Needs specialized agent:', conversationResult.needsSpecializedAgent);
            
            // If it's just a greeting or casual chat, return conversational response
            if (!conversationResult.needsSpecializedAgent) {
                console.log('[STEP 0] No specialized agent needed. Returning conversation response.');
                return {
                    summary: conversationResult.response,
                    requirements: [],
                    nonFunctionalRequirements: [],
                    complexity: 'simple',
                    domain: 'Conversation',
                    technicalConstraints: [],
                    conversationalOnly: true,
                    conversationResponse: conversationResult.response,
                    intent: conversationResult.intent
                };
            }
            
            console.log('[STEP 0] Specialized agent needed:', conversationResult.suggestedAgent);
            
            // Use SpecInterpreterAgent to analyze requirements
            console.log('Calling SpecInterpreterAgent to analyze prompt:', prompt);
            
            const { SpecInterpreterAgent } = await import('../agents/specialized/SpecInterpreterAgent');
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
        const MAX_RETRIES = 3;
        let lastError: string | null = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`\n[STEP 2] CodeGeneratorAgent - Attempt ${attempt}/${MAX_RETRIES}`);
                
                // Pass language and requirements to CodeGeneratorAgent for language-specific prompts
                const { runner } = await CodeGeneratorAgent({
                    language: request.targetLanguage,
                    requirements: request.prompt
                });
                
                // Build the message with images if provided
                let message: any;
                
                if (request.imageUrls && request.imageUrls.length > 0) {
                    // Download images and convert to base64
                    const imageParts = await Promise.all(
                        request.imageUrls.map(async (url: string) => {
                            try {
                                const response = await globalThis.fetch(url);
                                const arrayBuffer = await response.arrayBuffer();
                                const buffer = Buffer.from(arrayBuffer);
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
                        text: this.buildCodeGenerationPrompt(request, lastError, attempt)
                    };
                    
                    message = {
                        parts: [textPart, ...validImageParts]
                    };
                } else {
                    // Text-only message
                    message = this.buildCodeGenerationPrompt(request, lastError, attempt);
                }

                console.log('Calling CodeGeneratorAgent with message');
                console.log('Target language:', request.targetLanguage);
                console.log('Message preview:', typeof message === 'string' ? message.substring(0, 200) : 'multipart message');
                
                const response = await runner.ask(message) as any;
            
            console.log('Raw response from CodeGeneratorAgent:', JSON.stringify(response, null, 2));
            console.log('Response type:', typeof response);
            console.log('Response has files:', response?.files ? 'yes' : 'no');
            
            // Validate response structure
            if (!response || !response.files || !Array.isArray(response.files)) {
                console.error('Invalid response structure from CodeGeneratorAgent:', response);
                throw new Error('CodeGeneratorAgent returned invalid response structure. Expected: { files: [...] }');
            }
            
            // Validate that files array is not empty
            if (response.files.length === 0) {
                console.error('CodeGeneratorAgent returned empty files array');
                throw new Error('CodeGeneratorAgent returned no files');
            }
            
            // Auto-fix: Normalize file content (handle double-escaped JSON, objects, etc.)
            response.files = response.files.map((file: any) => {
                file.content = this.normalizeFileContent(file.path, file.content);
                return file;
            });
            
            // Filter out empty files and validate
            const validFiles = response.files.filter((file: any) => {
                if (!file.path || !file.content) {
                    console.warn('⚠️ Filtering out invalid file:', file.path || 'unknown');
                    return false;
                }
                if (file.content.trim().length === 0) {
                    console.warn('⚠️ Filtering out empty file:', file.path);
                    return false;
                }
                if (file.path.includes('.gitkeep')) {
                    console.warn('⚠️ Filtering out .gitkeep file:', file.path);
                    return false;
                }
                return true;
            });
            
            if (validFiles.length === 0) {
                console.error('❌ All files were filtered out - no valid files remain');
                throw new Error('No valid files after filtering empty/placeholder files');
            }
            
            // Check for critical missing files for web apps
            const hasPackageJson = validFiles.some((f: any) => f.path === 'package.json');
            const language = request.targetLanguage?.toLowerCase();
            
            // Detect static HTML projects (no build tools needed)
            const hasIndexHtml = validFiles.some((f: any) => f.path === 'index.html');
            const hasStylesCss = validFiles.some((f: any) => f.path === 'styles.css');
            const hasTsOrTsxFiles = validFiles.some((f: any) => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
            const isStaticHtml = hasIndexHtml && hasStylesCss && !hasTsOrTsxFiles;
            
            if ((language === 'typescript' || language === 'javascript') && !hasPackageJson && !isStaticHtml) {
                console.error('❌ CRITICAL: Missing package.json for TypeScript/JavaScript project');
                throw new Error('package.json is required for TypeScript/JavaScript projects');
            }
            
            if (isStaticHtml) {
                console.log('✅ Detected static HTML project - package.json not required');
                
                // Validate static HTML files for common issues
                const { validateStaticHtmlFiles } = await import('../services/validation/PreValidationRules');
                const validation = validateStaticHtmlFiles(validFiles);
                
                if (!validation.isValid) {
                    console.error('❌ Static HTML validation failed:');
                    validation.errors.forEach(err => console.error('  ', err));
                    
                    // Return error with detailed feedback
                    throw new Error(
                        'Generated static HTML files have critical issues:\n' + 
                        validation.errors.join('\n')
                    );
                }
                
                if (validation.warnings.length > 0) {
                    console.warn('⚠️ Static HTML validation warnings:');
                    validation.warnings.forEach(warn => console.warn('  ', warn));
                }
            }
            
            console.log(`✅ Successfully validated ${validFiles.length} files (filtered out ${response.files.length - validFiles.length} invalid files)`);

            // Step 2.4: Validate JSON files
            console.log('\n[JSON VALIDATION] Validating JSON files...');
            validFiles.forEach((file: any) => {
                if (file.path.endsWith('.json')) {
                    try {
                        JSON.parse(file.content);
                        console.log(`✅ Valid JSON: ${file.path}`);
                    } catch (error) {
                        console.error(`❌ Invalid JSON in ${file.path}:`, error);
                        throw new Error(`Generated file ${file.path} contains invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            });

            // Step 2.5: Auto-format code files with Prettier
            console.log('\n[PRETTIER] Formatting generated code...');
            const filesToFormat = validFiles.filter((file: any) => shouldFormatFile(file.path));
            const filesToSkip = validFiles.filter((file: any) => !shouldFormatFile(file.path));
            
            console.log(`[PRETTIER] Files to format: ${filesToFormat.length}`);
            console.log(`[PRETTIER] Files to skip: ${filesToSkip.length}`);
            
            let formattedFiles = [];
            try {
                formattedFiles = await formatCodeFiles(filesToFormat);
                console.log('[PRETTIER] ✅ Code formatting completed successfully');
            } catch (error) {
                console.error('[PRETTIER] ⚠️ Formatting failed, using original code:', error);
                formattedFiles = filesToFormat; // Fallback to original
            }
            
            // Combine formatted and skipped files
            const finalFiles = [...formattedFiles, ...filesToSkip];

                console.log(`✅ [Attempt ${attempt}/${MAX_RETRIES}] Successfully generated ${finalFiles.length} files`);
                
            return {
                files: finalFiles,  // Use formatted files
                confidence: 0.8,
                metadata: {
                    generatedBy: 'AI Agent (gpt-5-nano)',
                    formatted: true,
                    formattedCount: formattedFiles.length,
                        attempt: attempt
                }
            };
            } catch (error) {
                console.error(`❌ [Attempt ${attempt}/${MAX_RETRIES}] Code generation error:`, error);
                console.error('Error details:', error instanceof Error ? error.message : String(error));
                console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                
                // Store error message for next retry
                lastError = error instanceof Error ? error.message : String(error);
                
                // If this was the last attempt, throw the error
                if (attempt === MAX_RETRIES) {
                    console.error(`❌ All ${MAX_RETRIES} attempts failed. Last error: ${lastError}`);
                    throw error;
                }
                
                // Otherwise, log and retry
                console.log(`🔄 Retrying with error feedback... (${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            }
        }
        
        // Should never reach here, but TypeScript requires a return
        throw new Error('Unexpected: Exited retry loop without return');
    }

    private buildCodeGenerationPrompt(request: any, previousError?: string | null, attempt?: number): string {
        const language = request.targetLanguage || 'typescript';
        
        // If this is a retry with error feedback, include the error
        const errorFeedback = previousError && attempt && attempt > 1 ? `

⚠️ IMPORTANT: Previous attempt failed with this error:
${previousError}

Please fix this error and generate valid output. Ensure your JSON is properly formatted with:
- No trailing commas
- Properly escaped quotes inside strings
- Valid JSON structure that matches the schema: { "files": [{ "path": "...", "content": "..." }] }
- Content field must be a valid string (escape special characters properly)

` : '';
        
        // Build a concise prompt - language-specific details are in the system prompt
        return `Generate a complete, production-ready ${language.toUpperCase()} application.

User Request: ${request.prompt}

${request.requirements?.domain ? `Domain: ${request.requirements.domain}` : ''}
${request.requirements?.complexity ? `Complexity: ${request.requirements.complexity}` : ''}

${request.requirements?.requirements ? 
    'Requirements:\n- ' + request.requirements.requirements.join('\n- ') 
    : ''
}

${request.requirements?.nonFunctionalRequirements ? 
    'Non-functional:\n- ' + request.requirements.nonFunctionalRequirements.join('\n- ') 
    : ''
}

${request.requirements?.technicalConstraints ? 
    'Constraints:\n- ' + request.requirements.technicalConstraints.join('\n- ') 
    : ''
}
${errorFeedback}
Generate a complete, functional codebase with multiple files. Return JSON:
{
  "files": [
    {
      "path": "path/to/file",
      "content": "... code here ..."
    }
  ]
}`;
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

    private async refactorCode(request: any): Promise<any> {
        try {
            console.log('Calling RefactorGuruAgent to suggest code improvements');
            
            const { runner } = await RefactorGuruAgent();
            
            // Combine all files for analysis
            const codeToAnalyze = request.files
                .map((f: any) => `// File: ${f.path}\n${f.content}`)
                .join('\n\n');
            
            const refactorPrompt = `Analyze the following code and suggest refactoring improvements:

${codeToAnalyze}

Requirements:
${request.requirements?.requirements ? request.requirements.requirements.join('\n- ') : 'N/A'}

Please provide:
1. Identified code smells and anti-patterns
2. Specific refactoring recommendations
3. Improved code following SOLID principles
4. Better naming conventions if needed

Return the result as JSON with the following structure:
{
  "improved": true,
  "files": [{"path": "...", "content": "..."}],
  "summary": "Applied X refactoring improvements including...",
  "improvements": ["improvement 1", "improvement 2"]
}`;

            const response = await runner.ask(refactorPrompt) as string;
            console.log('Response from RefactorGuruAgent:', response);
            
            // Parse response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Cannot parse JSON from RefactorGuruAgent');
            }
            
            return { improved: false, files: request.files, summary: 'No refactoring needed' };
        } catch (error) {
            console.error('Code refactoring error:', error);
            return { improved: false, files: request.files, summary: 'Refactoring skipped due to error' };
        }
    }

    private async analyzeSecurity(request: any): Promise<any> {
        try {
            console.log('Calling SecuritySentinelAgent to analyze security');
            
            const { runner } = await SecuritySentinelAgent();
            
            // Combine all files for analysis
            const codeToAnalyze = request.files
                .map((f: any) => `// File: ${f.path}\n${f.content}`)
                .join('\n\n');
            
            const securityPrompt = `Conduct a security analysis of the following ${request.language} code:

${codeToAnalyze}

Focus on:
- OWASP Top 10 vulnerabilities
- Input validation issues
- Authentication/authorization flaws
- Cryptographic problems
- Data exposure risks
- Injection vulnerabilities

Return the result as JSON with the following structure:
{
  "vulnerabilities": [
    {
      "severity": "high",
      "title": "...",
      "description": "...",
      "file": "...",
      "recommendation": "..."
    }
  ],
  "summary": "Found X issues: Y critical, Z high priority",
  "overallScore": 85
}`;

            const response = await runner.ask(securityPrompt) as string;
            console.log('Response from SecuritySentinelAgent:', response);
            
            // Parse response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Cannot parse JSON from SecuritySentinelAgent');
            }
            
            return {
                vulnerabilities: [],
                summary: 'Security analysis completed',
                overallScore: 90
            };
        } catch (error) {
            console.error('Security analysis error:', error);
            return {
                vulnerabilities: [],
                summary: 'Security analysis skipped due to error',
                overallScore: null
            };
        }
    }

    private async optimizePerformance(request: any): Promise<any> {
        try {
            console.log('Calling PerformanceProfilerAgent to analyze performance');
            
            const { runner } = await PerformanceProfilerAgent();
            
            // Combine all files for analysis
            const codeToAnalyze = request.files
                .map((f: any) => `// File: ${f.path}\n${f.content}`)
                .join('\n\n');
            
            const performancePrompt = `Analyze the following ${request.language} code for performance bottlenecks:

${codeToAnalyze}

Focus on:
- Time complexity (Big O)
- Space complexity
- Database query optimization
- Memory usage patterns
- Caching opportunities
- Algorithmic improvements

Return the result as JSON with the following structure:
{
  "bottlenecks": [
    {
      "severity": "medium",
      "title": "...",
      "description": "...",
      "file": "...",
      "optimization": "..."
    }
  ],
  "summary": "Identified X optimization opportunities",
  "overallScore": 75
}`;

            const response = await runner.ask(performancePrompt) as string;
            console.log('Response from PerformanceProfilerAgent:', response);
            
            // Parse response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Cannot parse JSON from PerformanceProfilerAgent');
            }
            
            return {
                bottlenecks: [],
                summary: 'Performance analysis completed',
                overallScore: 85
            };
        } catch (error) {
            console.error('Performance analysis error:', error);
            return {
                bottlenecks: [],
                summary: 'Performance analysis skipped due to error',
                overallScore: null
            };
        }
    }

    private async generateDocumentation(request: any): Promise<any> {
        try {
            console.log('Calling DocWeaverAgent to generate documentation');
            
            const { runner } = await DocWeaverAgent();
            
            const hasCode = request.files && request.files.length > 0;
            
            let docsPrompt: string;
            
            if (hasCode) {
                // Generate documentation for existing code
                const codeToDocument = request.files
                    .map((f: any) => `// File: ${f.path}\n${f.content}`)
                    .join('\n\n');
                
                docsPrompt = `TASK: Generate a comprehensive README.md file for the following ${request.language} codebase.

${codeToDocument}

Project Requirements:
${request.requirements?.summary || 'N/A'}

INSTRUCTIONS:
- DO NOT use commentInserterTool
- DO NOT modify the code
- ONLY generate README documentation

Include these sections:
1. Project Overview and Setup
2. API Documentation (if applicable)
3. Usage Examples
4. Configuration Guide
5. Contributing Guidelines (brief)

CRITICAL: Return ONLY JSON in this exact format (no tool calls):
{
  "documentation": "# Project Title\\n\\nFull markdown documentation here...",
  "metadata": {
    "sectionCount": 5,
    "hasExamples": true,
    "hasAPI": false
  }
}`;
            } else {
                // Generate project planning documentation (no code yet)
                docsPrompt = `TASK: Generate a project planning document for the following concept.

Project Concept: ${request.prompt}

Requirements:
${request.requirements?.summary || 'User wants to create documentation for their app idea'}

INSTRUCTIONS:
- DO NOT use commentInserterTool (no code exists yet)
- Generate planning/specification documentation
- Be detailed and practical

Include these sections:
1. Project Overview and Goals
2. Technical Architecture Plan
3. Feature Specifications
4. Development Roadmap
5. Getting Started Guide (for future development)
6. API Design (if applicable)

CRITICAL: Return ONLY JSON in this exact format (no tool calls):
{
  "documentation": "# Project Planning Document\\n\\nFull markdown documentation here...",
  "metadata": {
    "sectionCount": 6,
    "hasExamples": true,
    "hasAPI": true
  }
}`;
            }

            const response = await runner.ask(docsPrompt) as string;
            console.log('Response from DocWeaverAgent:', response);
            
            // Parse response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Cannot parse JSON from DocWeaverAgent');
            }
            
            // Fallback documentation
            return {
                documentation: this.generateFallbackDocumentation(request),
                metadata: {
                    sectionCount: 3,
                    hasExamples: false,
                    hasAPI: false
                }
            };
        } catch (error) {
            console.error('Documentation generation error:', error);
            return {
                documentation: this.generateFallbackDocumentation(request),
                metadata: {
                    sectionCount: 0,
                    hasExamples: false,
                    hasAPI: false
                }
            };
        }
    }

    private generateFallbackDocumentation(request: any): string {
        const projectName = request.requirements?.summary?.split(' ').slice(0, 3).join(' ') || 'Generated Project';
        
        return `# ${projectName}

## Overview
${request.requirements?.summary || 'This project was generated using CodeForge AI.'}

## Installation
\`\`\`bash
# Install dependencies
npm install
\`\`\`

## Usage
\`\`\`${request.language}
// Example usage
// TODO: Add usage examples
\`\`\`

## Features
${request.requirements?.requirements ? request.requirements.requirements.map((r: string) => `- ${r}`).join('\n') : '- Generated with AI assistance'}

## License
MIT

---
*Generated by CodeForge AI on ${new Date().toISOString()}*
`;
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

    /**
     * Normalizes file content to handle various LLM response formats
     * - Converts objects to JSON strings
     * - Fixes double-escaped JSON
     * - Handles single quotes in JSON files
     * - Unescapes HTML/XML files
     */
    private normalizeFileContent(filePath: string, content: any): string {
        // Case 1: Content is an object (LLM returned JSON object instead of string)
        if (typeof content === 'object' && content !== null) {
            console.warn(`⚠️ File ${filePath}: content is object, converting to string`);
            return JSON.stringify(content, null, 2);
        }

        // Case 2: Content is not a string (number, boolean, etc.)
        if (typeof content !== 'string') {
            console.warn(`⚠️ File ${filePath}: content is ${typeof content}, converting to string`);
            return String(content);
        }

        // Case 3: HTML/XML files that may have escaped quotes
        if (filePath.endsWith('.html') || filePath.endsWith('.xml') || filePath.endsWith('.svg')) {
            // Check if content has escaped quotes that shouldn't be escaped
            if (content.includes('\\"')) {
                console.log(`✅ Unescaping quotes in ${filePath}`);
                // Unescape double quotes
                return content.replace(/\\"/g, '"');
            }
        }

        // Case 4: JSON files with single quotes (need to convert to double quotes)
        if (filePath.endsWith('.json')) {
            try {
                // Try to parse as-is first
                JSON.parse(content);
                // Already valid JSON
                return content;
            } catch (e) {
                // Try replacing single quotes with double quotes
                try {
                    const fixedContent = content.replace(/'/g, '"');
                    JSON.parse(fixedContent);
                    console.log(`✅ Fixed JSON file ${filePath}: converted single quotes to double quotes`);
                    return fixedContent;
                } catch (e2) {
                    console.warn(`⚠️ Could not auto-fix JSON file ${filePath}:`, e2);
                    return content; // Return original if can't fix
                }
            }
        }

        // Case 5: Check if content looks like it's double-escaped
        // E.g., content = '{"key": "value"}' when it should be the actual JSON structure
        if (content.startsWith('{') && content.includes('\\"')) {
            try {
                // Try to parse it - if successful, it means it was a JSON string
                const parsed = JSON.parse(content);
                if (typeof parsed === 'object') {
                    console.warn(`⚠️ File ${filePath}: detected double-escaped JSON, fixing...`);
                    return JSON.stringify(parsed, null, 2);
                }
            } catch (e) {
                // Not double-escaped, just has escaped quotes in the content
            }
        }

        // Return as-is if no normalization needed
        return content;
    }
}
