import axios from 'axios';
import { Client } from '@gradio/client';
import { getHuggingFaceKeyManager } from './HuggingFaceKeyManager';
import { getSupabaseClient } from '../storage/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Generation Service
 * Generates images using HuggingFace's Stable Diffusion via Gradio Client
 * Uses the same space and model as Narrato: stabilityai/stable-diffusion-3.5-large-turbo
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
 * Generate image using Gradio Client (same as Narrato implementation)
 * Space: stabilityai/stable-diffusion-3.5-large-turbo
 * API endpoint: /infer
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  // Connect to Gradio space with HuggingFace token
  const client = await Client.connect('stabilityai/stable-diffusion-3.5-large-turbo', {
    hf_token: apiKey,
  } as any);

  // Call the /infer endpoint with parameters (same as Narrato)
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

  // Extract image path from result
  // Result format: { data: [image_path, seed] }
  const imageData = result.data as any[];
  if (!imageData || !imageData[0]) {
    throw new Error('No image data returned from Gradio');
  }

  const imagePath = imageData[0];
  let imageUrl: string;

  // Handle different path formats
  if (typeof imagePath === 'string') {
    imageUrl = imagePath;
  } else if (imagePath?.url) {
    imageUrl = imagePath.url;
  } else if (imagePath?.path) {
    imageUrl = imagePath.path;
  } else {
    throw new Error(`Unexpected image data format: ${JSON.stringify(imagePath)}`);
  }

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
  const maxCycles = 3; // Try the full list of keys 3 times
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
          `(Attempt ${i + 1}/${numKeys}, Cycle ${cycle + 1}/${maxCycles})`
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
        
        console.error(
          `❌ Key ${keyMasked} failed: ${errorMessage}`
        );

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

    // Wait before retrying all keys
    if (cycle < maxCycles - 1) {
      const waitTime = 60;
      console.log(`⏰ Waiting ${waitTime} seconds before retrying all keys...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }
  }

  console.error('❌ All retry cycles failed. Could not generate image.');
  
  return {
    success: false,
    error: 'Failed to generate image after all retry attempts',
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
