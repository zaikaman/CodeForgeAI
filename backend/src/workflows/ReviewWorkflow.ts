import { BugHunterAgent } from '../agents/specialized/BugHunterAgent';
import { SecuritySentinelAgent } from '../agents/specialized/SecuritySentinelAgent';
import { PerformanceProfilerAgent } from '../agents/specialized/PerformanceProfilerAgent';

export interface ReviewRequest {
  code: any[]; // Array of files to review
  language?: string;
  options?: {
    checkSecurity?: boolean;
    checkPerformance?: boolean;
    checkStyle?: boolean;
    checkBugs?: boolean;
  };
}

export interface ReviewFinding {
  agent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'security' | 'performance' | 'style' | 'quality';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ReviewResult {
  findings: ReviewFinding[];
  summary: string;
  agentsInvolved: string[];
  overallScore: number; // 0-100
}

/**
 * Implements the code review workflow.
 * Runs multiple specialized agents in parallel to analyze code.
 */
export class ReviewWorkflow {
  private agents: Map<string, any> = new Map();
  private initialized = false;

  /**
   * Initialize all review agents
   */
  private async initializeAgents() {
    if (this.initialized) return;

    console.log('[ReviewWorkflow] Initializing review agents...');

    try {
      // Initialize all agents in parallel
      const [bugHunter, securitySentinel, performanceProfiler] = await Promise.all([
        BugHunterAgent(),
        SecuritySentinelAgent(),
        PerformanceProfilerAgent(),
      ]);

      this.agents.set('BugHunter', bugHunter);
      this.agents.set('SecuritySentinel', securitySentinel);
      this.agents.set('PerformanceProfiler', performanceProfiler);

      this.initialized = true;
      console.log('[ReviewWorkflow] All agents initialized successfully');
    } catch (error) {
      console.error('[ReviewWorkflow] Failed to initialize agents:', error);
      throw error;
    }
  }

  /**
   * Run the review workflow
   */
  async run(request: ReviewRequest): Promise<ReviewResult> {
    console.log('[ReviewWorkflow] Starting code review...');
    console.log(`[ReviewWorkflow] Files to review: ${request.code?.length || 0}`);

    await this.initializeAgents();

    const {
      code,
      language = 'typescript',
      options = {
        checkSecurity: true,
        checkPerformance: true,
        checkStyle: true,
        checkBugs: true,
      },
    } = request;

    // Prepare code context for agents
    const codeContext = this.prepareCodeContext(code, language);

    // Collect review tasks based on options
    const reviewTasks: Array<{ agent: string; promise: Promise<any> }> = [];
    const agentsInvolved: string[] = [];

    if (options.checkBugs) {
      const bugHunter = this.agents.get('BugHunter');
      if (bugHunter) {
        reviewTasks.push({
          agent: 'BugHunter',
          promise: bugHunter.runner.ask(codeContext),
        });
        agentsInvolved.push('BugHunter');
      }
    }

    if (options.checkSecurity) {
      const securitySentinel = this.agents.get('SecuritySentinel');
      if (securitySentinel) {
        reviewTasks.push({
          agent: 'SecuritySentinel',
          promise: securitySentinel.runner.ask(codeContext),
        });
        agentsInvolved.push('SecuritySentinel');
      }
    }

    if (options.checkPerformance) {
      const performanceProfiler = this.agents.get('PerformanceProfiler');
      if (performanceProfiler) {
        reviewTasks.push({
          agent: 'PerformanceProfiler',
          promise: performanceProfiler.runner.ask(codeContext),
        });
        agentsInvolved.push('PerformanceProfiler');
      }
    }

    if (options.checkStyle) {
    }

    console.log(`[ReviewWorkflow] Running ${reviewTasks.length} review agents in parallel...`);

    // Run all agents in parallel
    const results = await Promise.allSettled(
      reviewTasks.map(task => task.promise)
    );

    // Process results and extract findings
    const findings: ReviewFinding[] = [];

    results.forEach((result, index) => {
      const agentName = reviewTasks[index].agent;

      if (result.status === 'fulfilled') {
        const agentFindings = this.parseAgentResult(agentName, result.value);
        findings.push(...agentFindings);
        console.log(`[ReviewWorkflow] ${agentName} found ${agentFindings.length} issues`);
      } else {
        console.error(`[ReviewWorkflow] ${agentName} failed:`, result.reason);
        // Add error as a finding
        findings.push({
          agent: agentName,
          severity: 'low',
          category: 'quality',
          message: `Agent ${agentName} encountered an error during analysis`,
        });
      }
    });

    // Calculate overall score based on findings severity
    const overallScore = this.calculateScore(findings);

    // Generate summary
    const summary = this.generateSummary(findings, agentsInvolved);

    console.log(`[ReviewWorkflow] Review complete: ${findings.length} findings, score: ${overallScore}/100`);

    return {
      findings,
      summary,
      agentsInvolved,
      overallScore,
    };
  }

  /**
   * Prepare code context for agents
   */
  private prepareCodeContext(code: any[], language: string): string {
    if (!code || code.length === 0) {
      return 'No code provided for review';
    }

    // Format code for analysis
    const context = code.map((file, index) => {
      if (typeof file === 'string') {
        return `File ${index + 1}:\n${file}`;
      } else if (file.path && file.content) {
        return `File: ${file.path}\nLanguage: ${language}\n\n${file.content}`;
      }
      return `File ${index + 1}: [Unable to parse]`;
    }).join('\n\n---\n\n');

    return context;
  }

  /**
   * Parse agent result into findings
   */
  private parseAgentResult(agentName: string, result: any): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    // Try to parse different result formats
    if (typeof result === 'string') {
      // Simple text response - create a single finding
      findings.push({
        agent: agentName,
        severity: 'medium',
        category: this.getAgentCategory(agentName),
        message: result,
      });
    } else if (Array.isArray(result)) {
      // Array of findings
      result.forEach(item => {
        findings.push({
          agent: agentName,
          severity: item.severity || 'medium',
          category: item.category || this.getAgentCategory(agentName),
          message: item.message || item.description || String(item),
          file: item.file || item.filePath,
          line: item.line || item.lineNumber,
          suggestion: item.suggestion || item.fix,
        });
      });
    } else if (result && typeof result === 'object') {
      // Object with findings property
      if (result.findings && Array.isArray(result.findings)) {
        return this.parseAgentResult(agentName, result.findings);
      }
      
      // Single finding object
      findings.push({
        agent: agentName,
        severity: result.severity || 'medium',
        category: result.category || this.getAgentCategory(agentName),
        message: result.message || result.description || result.text || 'No issues found',
        file: result.file || result.filePath,
        line: result.line || result.lineNumber,
        suggestion: result.suggestion || result.fix,
      });
    }

    return findings;
  }

  /**
   * Get category based on agent name
   */
  private getAgentCategory(agentName: string): ReviewFinding['category'] {
    const categoryMap: Record<string, ReviewFinding['category']> = {
      'BugHunter': 'bug',
      'SecuritySentinel': 'security',
      'PerformanceProfiler': 'performance',
    };
    return categoryMap[agentName] || 'quality';
  }

  /**
   * Calculate overall score based on findings
   */
  private calculateScore(findings: ReviewFinding[]): number {
    if (findings.length === 0) return 100;

    // Deduct points based on severity
    let deductions = 0;
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          deductions += 20;
          break;
        case 'high':
          deductions += 10;
          break;
        case 'medium':
          deductions += 5;
          break;
        case 'low':
          deductions += 2;
          break;
      }
    });

    return Math.max(0, 100 - deductions);
  }

  /**
   * Generate summary of review
   */
  private generateSummary(findings: ReviewFinding[], agents: string[]): string {
    if (findings.length === 0) {
      return `✅ Code review complete! All ${agents.length} agents found no issues. Code quality is excellent.`;
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const mediumCount = findings.filter(f => f.severity === 'medium').length;
    const lowCount = findings.filter(f => f.severity === 'low').length;

    const parts: string[] = [
      `🔍 Code review complete by ${agents.length} specialized agents.`,
      `Found ${findings.length} total issues:`,
    ];

    if (criticalCount > 0) parts.push(`  ❗ ${criticalCount} critical`);
    if (highCount > 0) parts.push(`  ⚠️  ${highCount} high`);
    if (mediumCount > 0) parts.push(`  ⚡ ${mediumCount} medium`);
    if (lowCount > 0) parts.push(`  💡 ${lowCount} low`);

    // Add category breakdown
    const categories = findings.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    parts.push('');
    parts.push('Issues by category:');
    Object.entries(categories).forEach(([category, count]) => {
      parts.push(`  • ${category}: ${count}`);
    });

    return parts.join('\n');
  }
}
