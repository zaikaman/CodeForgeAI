/**
 * Issue Analyzer - Extracts and prioritizes information from GitHub issues
 * 
 * Helps GitHubAgent understand what the problem is BEFORE exploring the codebase
 * Prevents aimless code exploration
 */

import { Octokit } from '@octokit/rest';

export interface IssueAnalysis {
  title: string;
  description: string;
  keywords: string[];
  issueType: 'bug' | 'feature' | 'refactor' | 'performance' | 'unknown';
  affectedAreas: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedSearchPatterns: string[];
  estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
}

export class IssueAnalyzer {
  constructor(private octokit: Octokit) {}

  /**
   * Analyze a GitHub issue URL to extract problem information
   * Prevents aimless exploration by focusing search on actual problem
   */
  async analyzeIssueURL(issueURL: string): Promise<IssueAnalysis> {
    // Parse URL: https://github.com/owner/repo/issues/1
    const match = issueURL.match(
      /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/
    );

    if (!match) {
      throw new Error(`Invalid GitHub issue URL: ${issueURL}`);
    }

    const [, owner, repo, issueNumber] = match;

    try {
      const { data: issue } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: parseInt(issueNumber),
      });

      return this.parseIssueContent(issue.title, issue.body || '');
    } catch (error: any) {
      console.error(
        `[IssueAnalyzer] Failed to fetch issue: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Parse issue content to extract problem analysis
   */
  private parseIssueContent(title: string, body: string): IssueAnalysis {
    const combined = `${title}\n${body}`.toLowerCase();

    // Determine issue type
    const issueType = this.classifyIssueType(combined);

    // Extract keywords - these guide the search strategy
    const keywords = this.extractKeywords(combined);

    // Identify affected areas
    const affectedAreas = this.identifyAffectedAreas(combined);

    // Determine priority
    const priority = this.determinePriority(title, combined);

    // Generate targeted search patterns
    const suggestedSearchPatterns = this.generateSearchPatterns(
      keywords,
      issueType
    );

    // Estimate complexity
    const estimatedComplexity = this.estimateComplexity(
      combined,
      affectedAreas
    );

    return {
      title,
      description: body.substring(0, 500), // First 500 chars
      keywords,
      issueType,
      affectedAreas,
      priority,
      suggestedSearchPatterns,
      estimatedComplexity,
    };
  }

  /**
   * Classify the type of issue based on content
   */
  private classifyIssueType(
    content: string
  ): 'bug' | 'feature' | 'refactor' | 'performance' | 'unknown' {
    if (
      content.includes('bug') ||
      content.includes('error') ||
      content.includes('crash') ||
      content.includes('not working') ||
      content.includes('broken')
    ) {
      return 'bug';
    }

    if (
      content.includes('feature') ||
      content.includes('add') ||
      content.includes('implement') ||
      content.includes('new')
    ) {
      return 'feature';
    }

    if (
      content.includes('refactor') ||
      content.includes('cleanup') ||
      content.includes('reorganize') ||
      content.includes('restructure')
    ) {
      return 'refactor';
    }

    if (
      content.includes('performance') ||
      content.includes('slow') ||
      content.includes('optimize') ||
      content.includes('speed')
    ) {
      return 'performance';
    }

    return 'unknown';
  }

  /**
   * Extract technical keywords that should guide the search
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];

    // Function/class names (usually CamelCase)
    const functionMatches = content.match(
      /\b([A-Z][a-zA-Z0-9]*(?:Agent|Service|Controller|Handler|Manager|Util|Helper)?)\b/g
    );
    if (functionMatches) {
      keywords.push(...functionMatches.slice(0, 5));
    }

    // File extensions mentioned
    const fileMatches = content.match(/\.(ts|js|tsx|jsx|py|go|java|rs|rb)/g);
    if (fileMatches) {
      keywords.push(...new Set(fileMatches));
    }

    // API/Framework names
    const frameworks = [
      'express',
      'react',
      'vue',
      'angular',
      'django',
      'flask',
      'fastapi',
      'nodejs',
      'rust',
      'golang',
      'supabase',
      'firebase',
      'graphql',
      'rest',
    ];
    frameworks.forEach((fw) => {
      if (content.includes(fw)) {
        keywords.push(fw);
      }
    });

    // Common problem keywords
    const problemKeywords = [
      'timeout',
      'memory',
      'leak',
      'race condition',
      'deadlock',
      'null',
      'undefined',
      'error',
      'exception',
      'security',
      'authentication',
      'permission',
      'validation',
      'parsing',
      'encoding',
      'performance',
      'cache',
    ];
    problemKeywords.forEach((pk) => {
      if (content.includes(pk)) {
        keywords.push(pk);
      }
    });

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, 15);
  }

  /**
   * Identify which areas of the codebase might be affected
   */
  private identifyAffectedAreas(content: string): string[] {
    const areas: string[] = [];

    // Common areas mentioned in issues
    const areaPatterns: { [key: string]: string[] } = {
      'authentication/auth': ['auth', 'login', 'token', 'jwt', 'oauth'],
      'database/storage': ['database', 'db', 'sql', 'query', 'repository'],
      'api/routes': ['api', 'route', 'endpoint', 'controller', 'handler'],
      'frontend/ui': ['ui', 'component', 'react', 'vue', 'button', 'form'],
      'backend/server': ['backend', 'server', 'express', 'api', 'service'],
      'tests/testing': ['test', 'unit test', 'integration test', 'jest'],
      'performance/optimization': [
        'performance',
        'slow',
        'optimize',
        'speed',
        'cache',
      ],
      'security': ['security', 'vulnerability', 'xss', 'csrf', 'injection'],
      'configuration': ['config', 'environment', 'env', 'setup'],
    };

    Object.entries(areaPatterns).forEach(([area, keywords]) => {
      if (keywords.some((kw) => content.includes(kw))) {
        areas.push(area);
      }
    });

    return areas;
  }

  /**
   * Determine issue priority
   */
  private determinePriority(
    _title: string,
    content: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    const criticalKeywords = [
      'critical',
      'crash',
      'down',
      'security breach',
      'production',
    ];
    if (criticalKeywords.some((kw) => content.includes(kw))) {
      return 'critical';
    }

    const highKeywords = ['urgent', 'blocker', 'major', 'broken', 'error'];
    if (highKeywords.some((kw) => content.includes(kw))) {
      return 'high';
    }

    const lowKeywords = ['enhancement', 'nice to have', 'documentation'];
    if (lowKeywords.some((kw) => content.includes(kw))) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Generate specific search patterns to guide investigation
   */
  private generateSearchPatterns(
    keywords: string[],
    issueType: string
  ): string[] {
    const patterns: string[] = [];

    // Add primary keywords as search patterns
    keywords.slice(0, 5).forEach((kw) => {
      patterns.push(kw);
    });

    // Add issue-type-specific patterns
    if (issueType === 'bug') {
      patterns.push('error', 'exception', 'throw', 'catch');
    } else if (issueType === 'feature') {
      patterns.push('TODO', 'FIXME', 'not implemented');
    } else if (issueType === 'performance') {
      patterns.push('loop', 'async', 'await', 'callback', 'setTimeout');
    }

    // Add regex patterns for common issues
    if (
      keywords.some((kw) =>
        kw.includes('timeout') || kw.includes('performance')
      )
    ) {
      patterns.push('timeout|delay|sleep|setInterval');
    }

    if (keywords.some((kw) => kw.includes('auth'))) {
      patterns.push('token|jwt|session|password');
    }

    return [...new Set(patterns)].slice(0, 10);
  }

  /**
   * Estimate how complex the issue is to solve
   */
  private estimateComplexity(
    content: string,
    affectedAreas: string[]
  ): 'trivial' | 'simple' | 'moderate' | 'complex' {
    let score = 0;

    // Number of affected areas
    score += affectedAreas.length * 2;

    // Complexity keywords
    if (content.includes('race condition') || content.includes('deadlock')) {
      score += 5;
    }
    if (content.includes('performance') || content.includes('optimize')) {
      score += 3;
    }
    if (content.includes('security') || content.includes('vulnerability')) {
      score += 4;
    }
    if (content.includes('breaking change')) {
      score += 3;
    }

    if (score <= 2) return 'trivial';
    if (score <= 4) return 'simple';
    if (score <= 8) return 'moderate';
    return 'complex';
  }
}

/**
 * Helper to create analysis-guided search prompts for the agent
 */
export function createAnalysisGuidedPrompt(
  analysis: IssueAnalysis
): string {
  return `
## 🎯 ISSUE ANALYSIS SUMMARY

**Title:** ${analysis.title}
**Type:** ${analysis.issueType}
**Priority:** ${analysis.priority}
**Complexity:** ${analysis.estimatedComplexity}

### 📝 Problem Description
${analysis.description.substring(0, 300)}...

### 🔑 Key Keywords (Search These First)
${analysis.keywords.map((kw) => `- ${kw}`).join('\n')}

### 🎯 Affected Areas
${analysis.affectedAreas.map((area) => `- ${area}`).join('\n')}

### 🔍 Suggested Search Patterns (Use These to Guide Investigation)
${analysis.suggestedSearchPatterns.map((pattern) => `- ${pattern}`).join('\n')}

### ⚡ Investigation Strategy
1. **FIRST:** Search for these patterns in order: ${analysis.suggestedSearchPatterns.slice(0, 3).join(', ')}
2. **THEN:** Look in these areas: ${analysis.affectedAreas.slice(0, 2).join(', ')}
3. **AVOID:** Random exploration - stick to patterns above
4. **STOP:** When you've found all occurrences of search patterns

### ⏱️ Estimated Time
- ${analysis.estimatedComplexity === 'trivial' ? '5-10 minutes' : analysis.estimatedComplexity === 'simple' ? '15-30 minutes' : analysis.estimatedComplexity === 'moderate' ? '30 minutes - 1 hour' : '1+ hours'} to investigate
- ${analysis.estimatedComplexity === 'trivial' ? '5-10 minutes' : analysis.estimatedComplexity === 'simple' ? '10-20 minutes' : analysis.estimatedComplexity === 'moderate' ? '20-45 minutes' : '45+ minutes'} to implement
`;
}
