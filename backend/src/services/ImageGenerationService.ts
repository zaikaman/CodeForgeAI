import axios from 'axios';
import { Client } from '@gradio/client';
import { getHuggingFaceKeyManager } from './HuggingFaceKeyManager';
import { getSupabaseClient } from '../storage/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Generation Service - Using Official @gradio/client
 * Following the official Gradio JavaScript client documentation
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

const DEFAULT_OPTIONS: Partial<ImageGenerationOptions> = {
  negativePrompt: '',
  width: 1024,
  height: 1024,
  guidanceScale: 0,
  numInferenceSteps: 4,
  seed: 0,
  randomizeSeed: true,
};

// Gradio Space Configuration
const GRADIO_SPACE = 'stabilityai/stable-diffusion-3.5-large-turbo';

/**
 * Generate image using official @gradio/client library
 * Following the Gradio documentation exactly
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  console.log(`🚀 Connecting to Gradio Space with key ...${apiKey.slice(-4)}`);

  try {
    // Connect to Gradio Space with HuggingFace token
    // Using 'as any' to bypass TypeScript issues with dev version
    const client = await Client.connect(GRADIO_SPACE, {
      hf_token: apiKey,
    } as any);

    console.log(`✅ Connected to ${GRADIO_SPACE}`);

    // Call the /infer endpoint with parameters
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

    console.log(`✅ Generation complete!`);
    console.log(`Result type:`, typeof result);

    // The result.data is an array: [image_path, seed_used]
    if (!result || !result.data) {
      throw new Error('No data returned from Gradio');
    }

    const resultData = result.data as any[];
    if (!Array.isArray(resultData) || resultData.length === 0) {
      throw new Error('Invalid result format from Gradio');
    }

    const imageData = resultData[0];
    let imageUrl: string;

    // Handle different image data formats
    if (typeof imageData === 'string') {
      // Direct path or URL
      imageUrl = imageData.startsWith('http') 
        ? imageData 
        : `https://${GRADIO_SPACE.replace('/', '-')}.hf.space/file=${imageData}`;
    } else if (imageData?.url) {
      imageUrl = imageData.url;
    } else if (imageData?.path) {
      imageUrl = `https://${GRADIO_SPACE.replace('/', '-')}.hf.space/file=${imageData.path}`;
    } else {
      throw new Error(`Unknown image format: ${JSON.stringify(imageData)}`);
    }

    console.log(`📥 Downloading image from: ${imageUrl.substring(0, 80)}...`);

    // Download the generated image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    return Buffer.from(imageResponse.data);
  } catch (error: any) {
    console.error(`❌ Gradio client error:`, error.message);
    if (error.response) {
      console.error(`Response status:`, error.response.status);
      console.error(`Response data:`, error.response.data);
    }
    throw error;
  }
}

async function uploadImageToSupabase(
  imageBuffer: Buffer,
  userId: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseClient();
  
  const timestamp = Date.now();
  const randomString = uuidv4().substring(0, 8);
  const fileName = `generated-${timestamp}-${randomString}.png`;
  const filePath = `${userId}/generated/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath);

  console.log(`✅ Uploaded to Supabase: ${urlData.publicUrl}`);
  
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
  if (!prompt || prompt.trim() === '') {
    return { success: false, error: 'Empty prompt' };
  }

  const finalOptions: ImageGenerationOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    prompt,
  };

  const keyManager = getHuggingFaceKeyManager();
  const numKeys = keyManager.getKeyCount();

  if (numKeys === 0) {
    return { success: false, error: 'No API keys available' };
  }

  console.log(`🎨 Starting generation: "${prompt.substring(0, 100)}..."`);

  for (let i = 0; i < numKeys; i++) {
    let currentKey = '';
    try {
      currentKey = await keyManager.getNextKey();
      const keyMasked = `...${currentKey.slice(-4)}`;
      
      console.log(`🔑 Attempt ${i + 1}/${numKeys} with key ${keyMasked}`);

      const imageBuffer = await generateImageWithKey(prompt, currentKey, finalOptions);
      const { url, path } = await uploadImageToSupabase(imageBuffer, userId);

      console.log(`✅ Success with key ${keyMasked}`);

      return {
        success: true,
        imageUrl: url,
        imagePath: path,
        keyUsed: keyMasked,
      };
    } catch (error: any) {
      const keyMasked = currentKey ? `...${currentKey.slice(-4)}` : 'N/A';
      console.error(`❌ Key ${keyMasked} failed: ${error.message}`);
      console.error(`📋 Details:`, {
        name: error.name,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
        } : undefined
      });

      if (i === numKeys - 1) {
        console.log(`⚠️ All ${numKeys} keys failed`);
      }
      continue;
    }
  }

  return {
    success: false,
    error: 'All API keys failed',
  };
}

export async function generateMultipleImages(
  prompts: string[],
  userId: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<ImageGenerationResult[]> {
  console.log(`🎨 Generating ${prompts.length} images...`);

  const results: ImageGenerationResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n🖼️ Image ${i + 1}/${prompts.length}`);
    const result = await generateImage(prompts[i], userId, options);
    results.push(result);

    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Generated ${successCount}/${prompts.length} images`);

  return results;
}

export function getKeyManagerStats(): Record<string, number> {
  const keyManager = getHuggingFaceKeyManager();
  return keyManager.getUsageStats();
}
