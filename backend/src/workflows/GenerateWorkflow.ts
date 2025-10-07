import { SpecInterpreterAgent } from '../agents/specialized/SpecInterpreterAgent';
import { CodeGeneratorAgent } from '../agents/specialized/CodeGeneratorAgent';
import { TestCrafterAgent } from '../agents/specialized/TestCrafterAgent';
import { ReviewWorkflow } from './ReviewWorkflow';
import { AgentFactory } from '../agents/base/AgentFactory';

// import { Workflow, Step } from '@iqai/adk';

/**
 * Implements the code generation workflow.
 * Orchestrates SpecInterpreter, CodeGenerator, and TestCrafter agents, followed by a review.
 */
export class GenerateWorkflow /* extends Workflow */ {
    private specInterpreter: SpecInterpreterAgent;
    private codeGenerator: CodeGeneratorAgent;
    private testCrafter: TestCrafterAgent;
    private reviewWorkflow: ReviewWorkflow;

    constructor() {
        // super();
        // In a real scenario, agents would be created by the AgentFactory
        this.specInterpreter = AgentFactory.createAgent('SpecInterpreter') as SpecInterpreterAgent;
        this.codeGenerator = AgentFactory.createAgent('CodeGenerator') as CodeGeneratorAgent;
        this.testCrafter = AgentFactory.createAgent('TestCrafter') as TestCrafterAgent;
        this.reviewWorkflow = new ReviewWorkflow();
    }

    /**
     * Executes the generation workflow.
     * 1. Interprets the spec/prompt.
     * 2. Generates code.
     * 3. Generates tests for the code.
     * 4. Performs a review of the generated code and tests.
     * @param request The generation request containing the prompt.
     * @returns An object containing the generated code, tests, and review results.
     */
    async run(request: any): Promise<any> {
        const requirements = await this.specInterpreter.run(request.prompt);
        const generatedCode = await this.codeGenerator.run({ ...request, requirements });
        const tests = await this.testCrafter.run({ ...request, generatedCode });

        const codeWithTests = {
            ...generatedCode,
            tests: tests,
        };

        const reviewResult = await this.reviewWorkflow.run(codeWithTests);

        return {
            ...codeWithTests,
            review: reviewResult,
        };
    }
}
