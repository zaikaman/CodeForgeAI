/**
 * Test vendor ADK to ensure it has the fallback logic
 */

import "dotenv/config";

// Import from vendor path (like Heroku does)
import { LLMRegistry } from "./vendor/@iqai/adk/index.js";

async function testVendorADK() {
	console.log("🧪 Testing Vendor ADK (Heroku path)\n");

	// Test: glm-4.6 model (should use fallback)
	console.log("Test: glm-4.6 model (Chinese AI model)");
	try {
		const glmModel = LLMRegistry.newLLM("glm-4.6");
		console.log("✅ Created LLM for glm-4.6:", glmModel.model);
		console.log("   This should work with OpenAI API key fallback!");
	} catch (error: any) {
		console.log("❌ Error:", error.message);
	}

	console.log("\n✨ Test completed!");
}

testVendorADK().catch(console.error);
