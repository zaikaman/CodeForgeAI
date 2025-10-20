/**
 * Test script for the new @gradio/client implementation
 * Tests image generation using the official Gradio JavaScript client
 */

import { generateImage } from './src/services/ImageGenerationService.js';

async function testImageGeneration() {
  console.log('=== Testing SimpleGradioClient Implementation ===\n');

  const testPrompt = 'A beautiful sunset over mountains, vibrant colors, cinematic lighting';
  const testUserId = 'test-user';

  console.log(`Prompt: ${testPrompt}`);
  console.log(`User ID: ${testUserId}`);
  console.log('\nStarting generation...\n');

  try {
    const result = await generateImage(testPrompt, testUserId, {
      width: 768,
      height: 768,
      numInferenceSteps: 4,
    });

    console.log('\n=== Result ===');
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log(`Image URL: ${result.imageUrl}`);
      console.log(`Image Path: ${result.imagePath}`);
      console.log(`Key Used: ${result.keyUsed}`);
      console.log('\n✅ Test PASSED - Image generated successfully!');
    } else {
      console.log(`Error: ${result.error}`);
      console.log('\n❌ Test FAILED - Image generation failed');
    }
  } catch (error: any) {
    console.error('\n❌ Test FAILED with exception:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Run the test
testImageGeneration().catch(console.error);
