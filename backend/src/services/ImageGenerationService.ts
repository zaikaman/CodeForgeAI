import { Runware } from "@runware/sdk-js";
import { getSupabaseClient } from "../storage/SupabaseClient";
import { v4 as uuidv4 } from "uuid";

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
  randomizeSeed?: boolean;
  numberResults?: number;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imagePath?: string;
  error?: string;
  seed?: number;
  cost?: number;
}

const DEFAULT_OPTIONS: Partial<ImageGenerationOptions> = {
  negativePrompt: "",
  width: 1024,
  height: 1024,
  guidanceScale: 7.5,
  numInferenceSteps: 25,
  seed: 0,
  randomizeSeed: true,
  numberResults: 1,
};

const RUNWARE_MODEL = "runware:101@1";
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || "";

if (!RUNWARE_API_KEY) {
  console.warn("RUNWARE_API_KEY not found in environment variables");
}

async function generateImageWithRunware(
  prompt: string,
  options: ImageGenerationOptions
): Promise<{ imageUrl: string; seed?: number; cost?: number }> {
  console.log("Initializing Runware SDK");
  
  const runware = new Runware({
    apiKey: RUNWARE_API_KEY,
    shouldReconnect: true,
    globalMaxRetries: 3,
    timeoutDuration: 90000,
  });

  await runware.ensureConnection();
  console.log("Connected to Runware");

  const images = await runware.requestImages({
    positivePrompt: prompt,
    negativePrompt: options.negativePrompt || "",
    model: RUNWARE_MODEL,
    width: options.width || 1024,
    height: options.height || 1024,
    numberResults: options.numberResults || 1,
    outputFormat: "PNG",
    includeCost: true,
  });

  if (!images || images.length === 0) {
    throw new Error("No images returned from Runware");
  }

  const firstImage = images[0];
  if (!firstImage.imageURL) {
    throw new Error("Image URL not found in response");
  }

  await runware.disconnect();

  return {
    imageUrl: firstImage.imageURL,
    seed: firstImage.seed,
    cost: firstImage.cost,
  };
}

async function uploadImageToSupabase(
  imageUrl: string,
  userId: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseClient();
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const timestamp = Date.now();
  const randomString = uuidv4().substring(0, 8);
  const fileName = `generated-${timestamp}-${randomString}.png`;
  const filePath = `${userId}/generated/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-images")
    .upload(filePath, imageBuffer, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("chat-images")
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

export async function generateImage(
  prompt: string,
  userId: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<ImageGenerationResult> {
  if (!prompt || prompt.trim() === "") {
    return { success: false, error: "Empty prompt" };
  }

  if (!RUNWARE_API_KEY) {
    return { success: false, error: "RUNWARE_API_KEY not configured" };
  }

  const finalOptions: ImageGenerationOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    prompt,
  };

  try {
    const { imageUrl, seed, cost } = await generateImageWithRunware(prompt, finalOptions);
    const { url, path } = await uploadImageToSupabase(imageUrl, userId);

    return {
      success: true,
      imageUrl: url,
      imagePath: path,
      seed,
      cost,
    };
  } catch (error: any) {
    console.error("Generation failed:", error.message);
    return {
      success: false,
      error: error.message || "Image generation failed",
    };
  }
}

export async function generateMultipleImages(
  prompts: string[],
  userId: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<ImageGenerationResult[]> {
  const results: ImageGenerationResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const result = await generateImage(prompts[i], userId, options);
    results.push(result);

    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export function getKeyManagerStats(): Record<string, any> {
  return {
    provider: "runware",
    model: RUNWARE_MODEL,
    apiKeyConfigured: !!RUNWARE_API_KEY,
  };
}
