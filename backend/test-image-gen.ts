import { generateImage } from './src/services/ImageGenerationService';
import * as dotenv from 'dotenv';

dotenv.config();

async function testImageGeneration() {
  console.log('🧪 Testing Image Generation Service\n');

  const testPrompt = 'A beautiful sunset over mountains';
  const testUserId = 'test-user-123';

  try {
    console.log(`📝 Prompt: "${testPrompt}"`);
    console.log(`👤 User ID: ${testUserId}\n`);

    const result = await generateImage(testPrompt, testUserId, {
      width: 512,
      height: 512,
      numInferenceSteps: 1, // Fast for testing
    });

    console.log('\n📊 Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ TEST PASSED!');
      console.log(`🖼️ Image URL: ${result.imageUrl}`);
    } else {
      console.log('\n❌ TEST FAILED!');
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n💥 TEST CRASHED!');
    console.error(error);
    process.exit(1);
  }
}

testImageGeneration();
