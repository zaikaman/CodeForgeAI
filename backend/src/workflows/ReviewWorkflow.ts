import { BugHunterAgent } from '../agents/specialized/BugHunterAgent';
import { RefactorGuruAgent } from '../agents/specialized/RefactorGuruAgent';
import { SecuritySentinelAgent } from '../agents/specialized/SecuritySentinelAgent';
import { PerformanceProfilerAgent } from '../agents/specialized/PerformanceProfilerAgent';
import { DocWeaverAgent } from '../agents/specialized/DocWeaverAgent';
import { DebateMediator } from '../agents/resolvers/DebateMediator';
import { AgentFactory } from '../agents/base/AgentFactory';

// import { Workflow } from '@iqai/adk';

/**
 * Implements the code review workflow.
 * Runs multiple specialized agents in parallel and uses a DebateMediator to form a consensus.
 */
export class ReviewWorkflow /* extends Workflow */ {
    private bugHunter: BugHunterAgent;
    private refactorGuru: RefactorGuruAgent;
    private securitySentinel: SecuritySentinelAgent;
    private performanceProfiler: PerformanceProfilerAgent;
    private docWeaver: DocWeaverAgent;
    private mediator: DebateMediator;

    constructor() {
        // super();
        this.bugHunter = AgentFactory.createAgent('BugHunter') as BugHunterAgent;
        this.refactorGuru = AgentFactory.createAgent('RefactorGuru') as RefactorGuruAgent;
        this.securitySentinel = AgentFactory.createAgent('SecuritySentinel') as SecuritySentinelAgent;
        this.performanceProfiler = AgentFactory.createAgent('PerformanceProfiler') as PerformanceProfilerAgent;
        this.docWeaver = AgentFactory.createAgent('DocWeaver') as DocWeaverAgent;
        this.mediator = new DebateMediator();
    }

    /**
     * Executes the review workflow.
     * 1. Runs various analysis agents in parallel.
     * 2. Gathers all findings.
     * 3. Uses the DebateMediator to resolve conflicts and produce a final report.
     * @param code The code artifact to be reviewed.
     * @returns A consensus-based review report.
     */
    async run(code: any): Promise<any> {
        const reviewPromises = [
            this.bugHunter.run(code),
            this.refactorGuru.run(code),
            this.securitySentinel.run(code),
            this.performanceProfiler.run(code),
            this.docWeaver.run(code),
        ];

        const results = await Promise.all(reviewPromises);

        const consensus = await this.mediator.resolve(results);

        return consensus;
    }
}
