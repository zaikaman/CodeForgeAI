import { Runware } from "@runware/sdk-js";
import * as dotenv from "dotenv";

dotenv.config();

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || "";

function normalizeImageDimension(dimension: number): number {
  const clamped = Math.max(512, Math.min(2048, dimension));
  const normalized = Math.round(clamped / 64) * 64;
  return Math.max(512, Math.min(2048, normalized));
}

async function testDimension(width: number, height: number) {
  const normalizedWidth = normalizeImageDimension(width);
  const normalizedHeight = normalizeImageDimension(height);
  
  console.log(`\n🧪 Testing dimension: ${width}x${height} → ${normalizedWidth}x${normalizedHeight}`);
  
  let runware: any = null;

  try {
    runware = new Runware({ apiKey: RUNWARE_API_KEY });
    await runware.ensureConnection();

    const requestParams = {
      positivePrompt: "A beautiful red apple on wooden table, professional photography",
      model: "runware:101@1",
      width: normalizedWidth,
      height: normalizedHeight,
      numberResults: 1,
      outputFormat: "PNG" as const,
      includeCost: true,
    };

    const images = await runware.requestImages(requestParams);

    if (images && images.length > 0) {
      console.log(`   ✅ SUCCESS! Image URL: ${images[0].imageURL.substring(0, 60)}...`);
      return true;
    } else {
      console.log(`   ❌ FAILED: No images returned`);
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message || String(error)}`);
    return false;
  } finally {
    if (runware) {
      await runware.disconnect();
    }
  }
}

async function runTests() {
  console.log("\n🚀 Testing Various Image Dimensions with Runware\n");
  console.log("=".repeat(70));

  const testCases = [
    [512, 512],     // Standard square
    [1024, 1024],   // Default
    [1800, 1200],   // Production failing case
    [1100, 1100],   // Production failing case
    [1200, 1200],   // Production failing case
    [768, 768],     // Common AI size
    [640, 896],     // Portrait
    [896, 640],     // Landscape
  ];

  const results: any[] = [];

  for (const [width, height] of testCases) {
    const success = await testDimension(width, height);
    results.push({ width, height, success });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📊 Results Summary:\n");
  
  results.forEach(({ width, height, success }) => {
    const normalized = [
      normalizeImageDimension(width),
      normalizeImageDimension(height)
    ];
    console.log(`   ${success ? '✅' : '❌'} ${width}x${height} → ${normalized[0]}x${normalized[1]}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n   Total: ${successCount}/${results.length} passed`);
  console.log("\n" + "=".repeat(70));
}

runTests();
