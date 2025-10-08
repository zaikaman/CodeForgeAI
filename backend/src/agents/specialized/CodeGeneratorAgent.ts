/**
 * CodeGeneratorAgent - AI-powered code generation using local ADK
 */

import { AgentBuilder } from '../../../../adk-ts/packages/adk/dist/index.js';
import { codeParseTool } from '../../tools';
import { generationSchema } from '../../schemas/generation-schema';

const systemPrompt = `You are a Code Generator Agent. You write high-quality, production-ready code based on provided requirements. You must analyze the requirements and generate meaningful, domain-specific code rather than generic boilerplate.

For e-commerce/store applications, focus on:
- Product management, inventory, shopping cart functionality
- Payment processing integration points
- Customer management systems
- Order processing workflows

For authentication systems, focus on:
- User registration and login flows
- Session management
- Password hashing and validation
- Role-based access control

Always include:
- Proper error handling
- Input validation
- Clear documentation
- Production-ready code structure
- Appropriate design patterns`;

export const CodeGeneratorAgent = async () => {
  return AgentBuilder.create('CodeGeneratorAgent')
    .withModel('gpt-5-nano')
    .withInstruction(systemPrompt)
    .withOutputSchema(generationSchema)
    .build();
};
