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

const GRADIO_SPACE = 'stabilityai/stable-diffusion-3.5-large-turbo';
const GRADIO_API_URL = `https://${GRADIO_SPACE.replace('/', '-')}.hf.space`;

/**
 * Generate image using pure HTTP requests (no @gradio/client)
 */
async function generateImageWithKey(
  prompt: string,
  apiKey: string,
  options: ImageGenerationOptions
): Promise<Buffer> {
  console.log(`🚀 HTTP request to Gradio with key ...${apiKey.slice(-4)}`);

  const sessionHash = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Step 1: Join queue
  const joinResponse = await axios.post(
    `${GRADIO_API_URL}/queue/join`,
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
      event_data: null,
      fn_index: 3,
      session_hash: sessionHash,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 15000,
    }
  );

  console.log(`📡 Queue response:`, JSON.stringify(joinResponse.data).substring(0, 200));

  // Step 2: Poll for result
  const maxAttempts = 120;
  const pollInterval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const dataResponse = await axios.get(
        `${GRADIO_API_URL}/queue/data`,
        {
          params: { session_hash: sessionHash },
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 10000,
          responseType: 'text',
        }
      );

      const lines = dataResponse.data.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            if (!jsonStr || jsonStr === '[]') continue;
            
            const data = JSON.parse(jsonStr);
            
            if (data.msg === 'process_completed' && data.output?.data) {
              console.log(`✅ Generation complete!`);
              const resultData = data.output.data;
              
              if (!Array.isArray(resultData) || resultData.length === 0) {
                throw new Error(`Invalid result: ${JSON.stringify(resultData)}`);
              }

              const imageData = resultData[0];
              let imageUrl: string;

              if (typeof imageData === 'string') {
                imageUrl = imageData.startsWith('http') ? imageData : `${GRADIO_API_URL}/file=${imageData}`;
              } else if (imageData?.url) {
                imageUrl = imageData.url;
              } else if (imageData?.path) {
                imageUrl = `${GRADIO_API_URL}/file=${imageData.path}`;
              } else if (imageData?.name) {
                imageUrl = `${GRADIO_API_URL}/file=${imageData.name}`;
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

            if (data.msg === 'process_error') {
              throw new Error(data.output || 'Generation failed');
            }

            if (attempt % 10 === 0 && data.msg) {
              console.log(`💫 ${data.msg}`);
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

  throw new Error('Timeout after 120s');
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
