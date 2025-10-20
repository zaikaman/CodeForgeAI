import axios from 'axios';
import { Client } from '@gradio/client';
import { getHuggingFaceKeyManager } from './HuggingFaceKeyManager';
import { getSupabaseClient } from '../storage/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Generation Service
 * Generates images using HuggingFace's Stable Diffusion via Gradio Client
 * Uses the same space and model as QuillNova: stabilityai/stable-diffusion-3.5-large-turbo
 * Implementation based on QuillNova's Python code
 */

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
  randomizeSeed?: boolean;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imagePath?: string;
  error?: string;
  keyUsed?: string;
}

/**
 * Default options for image generation
 */
const DEFAULT_OPTIONS: Partial<ImageGenerationOptions> = {
  negativePrompt: '',
  width: 1024,
  height: 1024,
  guidanceScale: 0,
  numInferenceSteps: 4,
  seed: 0,
  randomizeSeed: true,
};

/**
 * Generate image using Gradio Client (exactly like QuillNova's Python implementation)
 * Space: stabilityai/stable-diffusion-3.5-large-turbo
 * API endpoint: /infer
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  console.log(`🚀 Connecting to Gradio with key ...${apiKey.slice(-4)}`);
  
  // Connect to Gradio client with HF token (same as Python: Client("space", hf_token=key))
  const client = await Client.connect(
    'stabilityai/stable-diffusion-3.5-large-turbo',
    { hf_token: apiKey as `hf_${string}` }
  );

  console.log(`📤 Calling /infer with prompt: "${prompt.substring(0, 60)}..."`);

  // Call predict with api_name="/infer" (same as Python)
  const result = await client.predict('/infer', {
    prompt: prompt,
    negative_prompt: options.negativePrompt || '',
    seed: options.seed || 0,
    randomize_seed: options.randomizeSeed ?? true,
    width: options.width || 1024,
    height: options.height || 1024,
    guidance_scale: options.guidanceScale || 0,
    num_inference_steps: options.numInferenceSteps || 4,
  });

  console.log(`� Received result from Gradio`);

  // Python code: if result and isinstance(result, (list, tuple)) and isinstance(result[0], str):
  //              local_image_path = result[0]
  if (!result || typeof result !== 'object') {
    throw new Error(`Unexpected result type: ${typeof result}`);
  }

  const resultData = (result as any).data;
  if (!Array.isArray(resultData) || resultData.length === 0) {
    throw new Error(`Invalid result format: ${JSON.stringify(result)}`);
  }

  const imageData = resultData[0];
  let imageUrl: string;

  // Handle different path formats
  if (typeof imageData === 'string') {
    imageUrl = imageData;
  } else if (imageData?.url) {
    imageUrl = imageData.url;
  } else if (imageData?.path) {
    imageUrl = imageData.path;
  } else {
    throw new Error(`Unexpected image data format: ${JSON.stringify(imageData)}`);
  }

  console.log(`📥 Downloading image from: ${imageUrl.substring(0, 80)}...`);

  // Download the generated image
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
  });

  return Buffer.from(imageResponse.data);
}

/**
 * Upload generated image to Supabase Storage
 */
async function uploadImageToSupabase(
  imageBuffer: Buffer,
  userId: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseClient();
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = uuidv4().substring(0, 8);
  const fileName = `generated-${timestamp}-${randomString}.png`;
  const filePath = `${userId}/generated/${fileName}`;

  // Upload to Supabase storage (same bucket as uploaded images)
  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image to Supabase: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath);

  console.log(`✅ Image uploaded to Supabase: ${urlData.publicUrl}`);
  
  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Generate image with automatic key rotation and retry
 * Similar to Narrato's generate_image function
 */
export async function generateImage(
  prompt: string,
  userId: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<ImageGenerationResult> {
  if (!prompt || prompt.trim() === '') {
    return {
      success: false,
      error: 'Empty prompt provided',
    };
  }

  const finalOptions: ImageGenerationOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    prompt,
  };

  const keyManager = getHuggingFaceKeyManager();
  const maxCycles = 1; // Only try once - if it fails, report to agent
  const numKeys = keyManager.getKeyCount();

  if (numKeys === 0) {
    return {
      success: false,
      error: 'No HuggingFace API keys available',
    };
  }

  console.log(`🎨 Starting image generation with prompt: "${prompt.substring(0, 100)}..."`);

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    for (let i = 0; i < numKeys; i++) {
      let currentKey = '';
      try {
        currentKey = await keyManager.getNextKey();
        const keyMasked = `...${currentKey.slice(-4)}`;
        
        console.log(
          `🔑 Attempting image generation with key ${keyMasked} ` +
          `(Attempt ${i + 1}/${numKeys})`
        );

        // Generate image
        const imageBuffer = await generateImageWithKey(prompt, currentKey, finalOptions);

        // Upload to Supabase
        const { url, path } = await uploadImageToSupabase(imageBuffer, userId);

        console.log(`✅ Image generation successful with key ${keyMasked}`);

        return {
          success: true,
          imageUrl: url,
          imagePath: path,
          keyUsed: keyMasked,
        };
      } catch (error: any) {
        const keyMasked = currentKey ? `...${currentKey.slice(-4)}` : 'N/A';
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        const errorName = error.name || 'Error';
        
        console.error(
          `❌ Key ${keyMasked} failed: ${errorName} - ${errorMessage}`
        );
        
        // Log full error details for debugging
        console.error(`📋 Full error details:`, {
          name: error.name,
          message: error.message,
          cause: error.cause,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            data: JSON.stringify(error.response.data).substring(0, 200)
          } : undefined
        });
        
        // Log more details for debugging
        if (error.stack) {
          console.error(`📚 Stack trace: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
        }

        // Check if it's a rate limit error
        if (error.response?.status === 429 || errorMessage.includes('rate limit')) {
          console.log(`⏳ Rate limit hit on key ${keyMasked}, rotating to next key`);
        }

        // If this was the last key in the cycle
        if (i === numKeys - 1) {
          console.log(`⚠️ All ${numKeys} keys failed in cycle ${cycle + 1}`);
        }

        continue;
      }
    }
  }

  console.error('❌ Image generation cycle failed. Service temporarily unavailable.');
  
  return {
    success: false,
    error: 'Image generation service is temporarily unavailable. Proceeding without generated images.',
  };
}

/**
 * Generate multiple images with the same or different prompts
 */
export async function generateMultipleImages(
  prompts: string[],
  userId: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<ImageGenerationResult[]> {
  console.log(`🎨 Generating ${prompts.length} images...`);

  const results: ImageGenerationResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n🖼️ Generating image ${i + 1}/${prompts.length}`);
    const result = await generateImage(prompts[i], userId, options);
    results.push(result);

    // Small delay between requests to avoid overwhelming the API
    if (i < prompts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n✅ Generated ${successCount}/${prompts.length} images successfully`);

  return results;
}

/**
 * Get key manager statistics
 */
export function getKeyManagerStats(): Record<string, number> {
  const keyManager = getHuggingFaceKeyManager();
  return keyManager.getUsageStats();
}
