/**
 * Test the full generation workflow
 */

import dotenv from 'dotenv';
import { GenerateWorkflow } from './src/workflows/GenerateWorkflow';

dotenv.config();

async function testGeneration() {
    console.log('Testing GenerateWorkflow...\n');
    
    const workflow = new GenerateWorkflow();
    
    const request = {
        prompt: 'simple calculator web app',
        targetLanguage: 'typescript',
        agents: ['code-generator'],
        requirements: {
            summary: 'A simple calculator web application',
            complexity: 'simple',
            domain: 'web'
        }
    };
    
    try {
        console.log('Starting generation...');
        console.log('Request:', JSON.stringify(request, null, 2));
        
        const result = await workflow.run(request);
        
        console.log('\n=== GENERATION RESULT ===');
        console.log('Success:', result.success);
        console.log('Files count:', result.files?.length || 0);
        
        if (result.files && result.files.length > 0) {
            console.log('\n=== FILES ===');
            result.files.forEach((file: any, idx: number) => {
                console.log(`\nFile ${idx + 1}:`);
                console.log('  Path:', file.path);
                console.log('  Size:', file.content?.length || 0, 'bytes');
                console.log('  Preview:', file.content?.substring(0, 100).replace(/\n/g, ' '));
            });
        }
        
        if (result.error) {
            console.log('\n❌ Error:', result.error);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    }
}

testGeneration();
