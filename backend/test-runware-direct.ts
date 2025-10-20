import { Runware } from "@runware/sdk-js";
import * as dotenv from "dotenv";

dotenv.config();

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || "";

async function testRunwareDirect() {
  console.log("\n🧪 Testing Runware API Direct Connection\n");
  console.log("=" .repeat(60));
  
  console.log("\n1️⃣ API Key Check:");
  console.log(`   - Configured: ${!!RUNWARE_API_KEY}`);
  console.log(`   - Length: ${RUNWARE_API_KEY.length} chars`);
  console.log(`   - Starts with: ${RUNWARE_API_KEY.substring(0, 10)}...`);
  
  if (!RUNWARE_API_KEY) {
    console.error("❌ RUNWARE_API_KEY not found!");
    process.exit(1);
  }

  let runware: any = null;

  try {
    console.log("\n2️⃣ Initializing Runware Client:");
    runware = new Runware({
      apiKey: RUNWARE_API_KEY,
    });
    console.log("   ✅ Client created");

    console.log("\n3️⃣ Connecting to Runware:");
    await runware.ensureConnection();
    console.log("   ✅ Connected successfully");

    console.log("\n4️⃣ Sending test request:");
    const requestParams = {
      positivePrompt: "A beautiful red apple on a wooden table, professional photography, high quality, detailed",
      model: "runware:101@1",
      width: 512,
      height: 512,
      numberResults: 1,
      outputFormat: "PNG" as const,
      includeCost: true,
    };
    
    console.log("   Request params:", JSON.stringify(requestParams, null, 2));
    
    console.log("\n   ⏳ Waiting for response...");
    const images = await runware.requestImages(requestParams);
    
    console.log("\n5️⃣ Response received:");
    console.log(`   - Image count: ${images?.length || 0}`);
    
    if (images && images.length > 0) {
      const firstImage = images[0];
      console.log("\n   First image details:");
      console.log(`   - URL: ${firstImage.imageURL?.substring(0, 80)}...`);
      console.log(`   - Seed: ${firstImage.seed}`);
      console.log(`   - Cost: ${firstImage.cost}`);
      console.log(`   - All keys: ${Object.keys(firstImage).join(', ')}`);
      console.log("\n✅ SUCCESS! Image generation works!");
    } else {
      console.log("\n❌ No images in response");
    }

  } catch (error: any) {
    console.log("\n❌ ERROR OCCURRED:");
    console.log("   Error details:", {
      type: typeof error,
      constructor: error?.constructor?.name,
      message: error?.message,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      statusCode: error?.statusCode,
    });
    
    // Try to extract all error info
    console.log("\n   Full error object properties:");
    const allProps = Object.getOwnPropertyNames(error);
    allProps.forEach(prop => {
      console.log(`   - ${prop}: ${JSON.stringify(error[prop])}`);
    });

    // Try JSON stringify with all properties
    try {
      console.log("\n   Error as JSON:");
      console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch {
      console.log("   (Cannot stringify error)");
    }

    console.log("\n   Error toString:", String(error));
    
  } finally {
    if (runware) {
      try {
        await runware.disconnect();
        console.log("\n🔌 Disconnected from Runware");
      } catch (e) {
        console.log("\n⚠️ Warning: Failed to disconnect:", e);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Test completed\n");
}

testRunwareDirect();
