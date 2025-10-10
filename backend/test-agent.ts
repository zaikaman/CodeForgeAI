/**
 * Test script to verify CodeGeneratorAgent works correctly
 */

import dotenv from 'dotenv';
import { CodeGeneratorAgent } from './src/agents/specialized/CodeGeneratorAgent';

// Load environment variables
dotenv.config();

async function testAgent() {
    console.log('Testing CodeGeneratorAgent...\n');
    
    try {
        const { runner } = await CodeGeneratorAgent({
            language: 'typescript',
            requirements: 'simple hello world web server'
        });
        
        console.log('Agent created successfully');
        console.log('Sending test prompt...\n');
        
        const prompt = `Generate a complete, production-ready TYPESCRIPT application.

User Request: simple hello world web server

Generate a complete, functional codebase with multiple files. Return JSON:
{
  "files": [
    {
      "path": "path/to/file",
      "content": "... code here ..."
    }
  ]
}`;
        
        const response = await runner.ask(prompt);
        
        console.log('\n=== RAW RESPONSE ===');
        console.log('Type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        console.log('Keys:', response ? Object.keys(response) : 'null');
        console.log('\nFull response:');
        console.log(JSON.stringify(response, null, 2));
        
        // Check structure
        if (response && typeof response === 'object' && 'files' in response) {
            const files = (response as any).files;
            console.log('\n=== FILES ARRAY ===');
            console.log('Files count:', files?.length || 0);
            if (Array.isArray(files)) {
                files.forEach((file: any, idx: number) => {
                    console.log(`\nFile ${idx + 1}:`);
                    console.log('  Path:', file.path);
                    console.log('  Content length:', file.content?.length || 0);
                    console.log('  Content preview:', file.content?.substring(0, 100));
                });
            }
        } else {
            console.log('\n❌ Response does not have "files" property!');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    }
}

testAgent();
