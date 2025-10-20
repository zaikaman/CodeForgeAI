import axios from 'axios';
import { getHuggingFaceKeyManager } from './HuggingFaceKeyManager';
import { getSupabaseClient } from '../storage/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Generation Service
 * Generates images using HuggingFace's Stable Diffusion via Gradio HTTP API
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
 * Gradio API configuration
 */
const GRADIO_SPACE_URL = 'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space';
const GRADIO_API_BASE = `${GRADIO_SPACE_URL}/gradio_api`;

/**
 * Generate image using Gradio HTTP API (cURL equivalent)
 * Space: stabilityai/stable-diffusion-3.5-large-turbo
 * API endpoint: /infer
 * 
 * Two-step process:
 * 1. POST to /call/infer to start generation (returns event_id)
 * 2. GET /call/infer/{event_id} to poll for results
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  // Step 1: POST to start image generation
  const postResponse = await axios.post(
    `${GRADIO_API_BASE}/call/infer`,
    {
      data: [
        prompt,                                    // [0] prompt
        options.negativePrompt || '',              // [1] negative_prompt
        options.seed || 0,                         // [2] seed
        options.randomizeSeed ?? true,             // [3] randomize_seed
        options.width || 1024,                     // [4] width
        options.height || 1024,                    // [5] height
        options.guidanceScale || 0,                // [6] guidance_scale
        options.numInferenceSteps || 4,            // [7] num_inference_steps
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      timeout: 10000,
    }
  );

  // Extract event_id from response
  const eventId = postResponse.data?.event_id;
  if (!eventId) {
    throw new Error('No event_id returned from Gradio API');
  }

  // Step 2: Poll GET endpoint for results
  const maxAttempts = 60; // 60 seconds max wait
  const pollInterval = 1000; // 1 second between polls

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const getResponse = await axios.get(
        `${GRADIO_API_BASE}/call/infer/${eventId}`,
        {
          headers: {
            Accept: 'text/event-stream',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          timeout: 5000,
          responseType: 'text',
        }
      );

      // Parse SSE (Server-Sent Events) response
      const lines = getResponse.data.split('\n');
      let resultData: any = null;

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.substring(6));
            
            // Check if generation is complete
            if (jsonData.msg === 'process_completed' && jsonData.output?.data) {
              resultData = jsonData.output.data;
              break;
            }
            
            // Check for errors
            if (jsonData.msg === 'process_error') {
              throw new Error(jsonData.error || 'Image generation failed');
            }
          } catch (parseError) {
            // Skip malformed JSON
            continue;
          }
        }
      }

      if (resultData) {
        // Extract image URL from result data
        // Format: [image_data, seed]
        const imageData = resultData[0];
        let imageUrl: string;

        if (typeof imageData === 'string') {
          imageUrl = imageData;
        } else if (imageData?.url) {
          imageUrl = imageData.url;
        } else if (imageData?.path) {
          // Convert path to full URL
          imageUrl = `${GRADIO_SPACE_URL}/file=${imageData.path}`;
        } else {
          throw new Error(`Unexpected image data format: ${JSON.stringify(imageData)}`);
        }

        // Ensure URL is absolute
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${GRADIO_SPACE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }

        // Download the generated image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        return Buffer.from(imageResponse.data);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (pollError: any) {
      // Only throw on final attempt
      if (attempt === maxAttempts - 1) {
        throw pollError;
      }
      // Otherwise continue polling
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Image generation timed out after 60 seconds');
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
        
        // Log more details for debugging
        if (error.stack) {
          console.error(`Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
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
