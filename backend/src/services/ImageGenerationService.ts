import axios from 'axios';
import { getHuggingFaceKeyManager } from './HuggingFaceKeyManager';
import { getSupabaseClient } from '../storage/SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Generation Service - Pure HTTP Implementation
 * No library dependencies, just direct HTTP calls to Gradio API
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

// Gradio Space URL - note: dots in version need to be converted to hyphens
const GRADIO_API_URL = `https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space`;
const GRADIO_API_BASE = `${GRADIO_API_URL}/gradio_api`;

/**
 * Generate image using pure HTTP requests (following Gradio API docs)
 * Two-step process:
 * 1. POST to /call/infer to get EVENT_ID
 * 2. GET /call/infer/{EVENT_ID} to stream results
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  console.log(`🚀 HTTP request to Gradio with key ...${apiKey.slice(-4)}`);

  // Step 1: POST to /call/infer
  const postResponse = await axios.post(
    `${GRADIO_API_BASE}/call/infer`,
    {
      data: [
        prompt,
        options.negativePrompt || '',
        options.seed || 0,
        options.randomizeSeed ?? true,
        options.width || 1024,
        options.height || 1024,
        options.guidanceScale || 0,
        options.numInferenceSteps || 4,
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 15000,
    }
  );

  const eventId = postResponse.data?.event_id;
  if (!eventId) {
    throw new Error('No event_id returned from Gradio API');
  }

  console.log(`📡 Event ID: ${eventId}`);

  // Step 2: GET /call/infer/{EVENT_ID} - streaming SSE
  const maxAttempts = 30;
  const pollInterval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const dataResponse = await axios.get(
        `${GRADIO_API_BASE}/call/infer/${eventId}`,
        {
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 10000,
          responseType: 'text',
        }
      );

      const lines = dataResponse.data.split('\n');
      let currentEvent = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Parse event type
        if (trimmed.startsWith('event: ')) {
          currentEvent = trimmed.substring(7).trim();
          continue;
        }
        
        // Parse data
        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.substring(6).trim();
            if (!jsonStr || jsonStr === '[]') continue;
            
            const data = JSON.parse(jsonStr);
            
            // On 'complete' event, data is directly the result array
            if (currentEvent === 'complete' && Array.isArray(data)) {
              console.log(`✅ Generation complete!`);
              
              if (data.length === 0) {
                throw new Error('Empty result array');
              }

              const imageData = data[0];
              let imageUrl: string;

              // Handle Gradio FileData format
              if (typeof imageData === 'string') {
                imageUrl = imageData.startsWith('http') ? imageData : `${GRADIO_API_URL}/file=${imageData}`;
              } else if (imageData?.url) {
                imageUrl = imageData.url;
              } else if (imageData?.path) {
                imageUrl = `${GRADIO_API_BASE}/file=${imageData.path}`;
              } else {
                throw new Error(`Unknown image format: ${JSON.stringify(imageData)}`);
              }

              console.log(`📥 Downloading from: ${imageUrl.substring(0, 80)}...`);

              const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: { 'Authorization': `Bearer ${apiKey}` },
              });

              return Buffer.from(imageResponse.data);
            }

            // Handle error event
            if (currentEvent === 'error') {
              throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
            }

            // Log progress
            if (attempt % 10 === 0 && currentEvent) {
              console.log(`💫 Event: ${currentEvent}`);
            }
          } catch (e) {
            continue;
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (err: any) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Image generation timed out after 30s');
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
