/**
 * QualityAssuranceAgent - Specialized agent for fast code validation
 * 
 * Responsibilities:
 * - Run fast static validation (syntax, dependencies, patterns)
 * - Auto-fix common issues using rule-based fixes
 * - Coordinate with CodeFixerAgent for complex issues
 * - Report validation results with confidence scores
 * 
 * Performance: < 2 seconds for full validation + auto-fix
 */

import { AgentBuilder } from '@iqai/adk';
import { FastValidatorService } from '../../services/FastValidatorService';
import { SmartAutoFixerService } from '../../services/SmartAutoFixerService';
import type { GeneratedFile } from '../../services/FastValidatorService';

export interface QARequest {
  files: GeneratedFile[];
  language: string;
  autoFix?: boolean;
  maxAttempts?: number;
}

export interface QAResult {
  isValid: boolean;
  files: GeneratedFile[];
  errors: any[];
  warnings: any[];
  confidence: number;
  fixedCount: number;
  appliedFixes: string[];
  duration: number;
  attempts: number;
}

/**
 * QualityAssuranceAgent - Fast validation with auto-fixing
 */
export class QualityAssuranceAgent {
  private validator = new FastValidatorService();
  private autoFixer = new SmartAutoFixerService();
  
  /**
   * Run quality assurance on generated code
   */
  async run(request: QARequest): Promise<QAResult> {
    const startTime = Date.now();
    const maxAttempts = request.maxAttempts || 2;
    
    console.log('\n🔍 QualityAssuranceAgent: Starting validation...');
    console.log(`   Files: ${request.files.length}, Language: ${request.language}`);
    
    let currentFiles = request.files;
    let totalFixedCount = 0;
    let allAppliedFixes: string[] = [];
    let attempt = 0;
    
    // Validation loop with auto-fixing
    while (attempt < maxAttempts) {
      attempt++;
      
      console.log(`\n   Attempt ${attempt}/${maxAttempts}`);
      
      // Run fast validation
      const validation = await this.validator.validate(currentFiles, request.language);
      
      console.log(`   ✓ Validation: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
      console.log(`   ✓ Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
      
      // If valid or auto-fix disabled, return result
      if (validation.isValid || !request.autoFix) {
        const duration = Date.now() - startTime;
        
        console.log(`✅ QualityAssuranceAgent: Complete in ${duration}ms`);
        
        return {
          isValid: validation.isValid,
          files: currentFiles,
          errors: validation.errors,
          warnings: validation.warnings,
          confidence: validation.confidence,
          fixedCount: totalFixedCount,
          appliedFixes: allAppliedFixes,
          duration,
          attempts: attempt
        };
      }
      
      // If last attempt, return with errors
      if (attempt >= maxAttempts) {
        console.log(`   ⚠ Max attempts reached. Returning with ${validation.errors.length} unresolved errors.`);
        break;
      }
      
      // Auto-fix issues
      console.log(`   🔧 Auto-fixing ${validation.errors.length} issues...`);
      const fixResult = await this.autoFixer.autoFix(currentFiles, validation.errors);
      
      if (fixResult.fixed) {
        currentFiles = fixResult.files;
        totalFixedCount += fixResult.fixedCount;
        allAppliedFixes.push(...fixResult.appliedFixes);
        
        console.log(`   ✓ Fixed: ${fixResult.fixedCount}/${validation.errors.length}`);
        console.log(`   ✓ Applied: ${fixResult.appliedFixes.join(', ')}`);
      } else {
        console.log(`   ✗ Could not apply fixes. Stopping.`);
        break;
      }
    }
    
    // Final validation
    const finalValidation = await this.validator.validate(currentFiles, request.language);
    const duration = Date.now() - startTime;
    
    console.log(`\n${finalValidation.isValid ? '✅' : '⚠'} QualityAssuranceAgent: Complete in ${duration}ms`);
    console.log(`   Fixed: ${totalFixedCount} issues across ${attempt} attempts`);
    console.log(`   Remaining: ${finalValidation.errors.length} errors, ${finalValidation.warnings.length} warnings`);
    
    return {
      isValid: finalValidation.isValid,
      files: currentFiles,
      errors: finalValidation.errors,
      warnings: finalValidation.warnings,
      confidence: finalValidation.confidence,
      fixedCount: totalFixedCount,
      appliedFixes: allAppliedFixes,
      duration,
      attempts: attempt
    };
  }
  
  /**
   * Quick validation without auto-fix (< 1s)
   */
  async validateOnly(files: GeneratedFile[], language: string): Promise<{
    isValid: boolean;
    errors: any[];
    warnings: any[];
    confidence: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    const validation = await this.validator.validate(files, language);
    const duration = Date.now() - startTime;
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      confidence: validation.confidence,
      duration
    };
  }
}

/**
 * Factory function to create QualityAssuranceAgent
 */
export const createQualityAssuranceAgent = (): QualityAssuranceAgent => {
  return new QualityAssuranceAgent();
};

/**
 * Lightweight ADK-compatible wrapper for orchestration
 */
const systemPrompt = `You are a Quality Assurance Agent specializing in fast code validation.

Your responsibilities:
1. Run comprehensive static analysis (syntax, dependencies, patterns)
2. Auto-fix common issues using proven rules
3. Report validation results with detailed diagnostics
4. Provide confidence scores for code quality

You operate in < 2 seconds to maintain fast feedback loops.

Performance characteristics:
- Syntax validation: 100-200ms
- Dependency check: 200-300ms  
- Pattern matching: 300-500ms
- Auto-fixing: 100-500ms
- Total: < 2 seconds

You prioritize:
1. Critical errors (syntax, missing files) - MUST be fixed
2. High severity (missing deps, logic bugs) - SHOULD be fixed
3. Warnings (style, best practices) - NICE to fix

Output format:
{
  "isValid": boolean,
  "confidence": 0.0-1.0,
  "errors": [...],
  "warnings": [...],
  "fixedIssues": [...],
  "duration": milliseconds
}`;

export const QualityAssuranceAgentADK = AgentBuilder.create('QualityAssuranceAgent')
  .withModel('gpt-5-nano') // Fast model for validation
  .withInstruction(systemPrompt)
  .build();
