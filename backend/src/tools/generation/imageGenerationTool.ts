import { createTool } from '@iqai/adk';
import { z } from 'zod';
import { generateImage, generateMultipleImages, type ImageGenerationOptions } from '../../services/ImageGenerationService';

/**
 * Image Generation Tool
 * Allows agents to generate product images using HuggingFace Stable Diffusion
 * Images are automatically uploaded to Supabase storage
 */

export interface GenerateImageInput {
  prompt: string;
  userId: string;
  options?: Partial<ImageGenerationOptions>;
}

export interface GenerateMultipleImagesInput {
  prompts: string[];
  userId: string;
  options?: Partial<ImageGenerationOptions>;
}

/**
 * Generate a single image from a text prompt
 * 
 * @example
 * ```typescript
 * const result = await imageGenerationTool({
 *   prompt: "A professional product photo of red Nike running shoes on white background",
 *   userId: "user123"
 * });
 * 
 * if (result.success) {
 *   console.log("Image URL:", result.imageUrl);
 *   // Use this URL in HTML: <img src="${result.imageUrl}" alt="Product" />
 * }
 * ```
 */
export async function imageGenerationTool(input: GenerateImageInput) {
  const { prompt, userId, options = {} } = input;

  if (!prompt || !userId) {
    return {
      success: false,
      error: 'Both prompt and userId are required',
    };
  }

  console.log(`\n🎨 Image Generation Tool called by user ${userId}`);
  console.log(`📝 Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);

  const result = await generateImage(prompt, userId, options);

  if (result.success) {
    console.log(`✅ Image generated successfully: ${result.imageUrl}`);
    return {
      success: true,
      imageUrl: result.imageUrl,
      imagePath: result.imagePath,
      message: 'Image generated successfully. You can now use this URL in your HTML/CSS code.',
      usage: {
        htmlExample: `<img src="${result.imageUrl}" alt="Generated image" />`,
        cssExample: `background-image: url('${result.imageUrl}');`,
      },
    };
  } else {
    console.error(`❌ Image generation failed: ${result.error}`);
    return {
      success: false,
      error: result.error,
      message: 'Failed to generate image. Please try again with a different prompt.',
    };
  }
}

/**
 * Generate multiple images from text prompts
 * Useful for creating product galleries, variations, etc.
 * 
 * @example
 * ```typescript
 * const result = await multipleImageGenerationTool({
 *   prompts: [
 *     "Red Nike shoes, professional product photo",
 *     "Blue Adidas shoes, professional product photo",
 *     "Black Puma shoes, professional product photo"
 *   ],
 *   userId: "user123"
 * });
 * 
 * // Use in HTML carousel or grid
 * result.images.forEach((img, i) => {
 *   if (img.success) {
 *     console.log(`Image ${i+1}: ${img.imageUrl}`);
 *   }
 * });
 * ```
 */
export async function multipleImageGenerationTool(input: GenerateMultipleImagesInput) {
  const { prompts, userId, options = {} } = input;

  if (!prompts || prompts.length === 0 || !userId) {
    return {
      success: false,
      error: 'Both prompts array and userId are required',
    };
  }

  console.log(`\n🎨 Multiple Image Generation Tool called by user ${userId}`);
  console.log(`📝 Generating ${prompts.length} images`);

  const results = await generateMultipleImages(prompts, userId, options);

  const successfulImages = results.filter(r => r.success);
  const failedImages = results.filter(r => !r.success);

  console.log(`✅ Successfully generated ${successfulImages.length}/${prompts.length} images`);

  return {
    success: successfulImages.length > 0,
    totalRequested: prompts.length,
    totalGenerated: successfulImages.length,
    totalFailed: failedImages.length,
    images: results.map((result, index) => ({
      index,
      prompt: prompts[index],
      success: result.success,
      imageUrl: result.imageUrl,
      imagePath: result.imagePath,
      error: result.error,
    })),
    imageUrls: successfulImages.map(r => r.imageUrl),
    message: `Generated ${successfulImages.length} out of ${prompts.length} images successfully.`,
    usage: {
      htmlGalleryExample: successfulImages.map(r => 
        `<img src="${r.imageUrl}" alt="Generated image" />`
      ).join('\n'),
    },
  };
}

/**
 * Create ADK-compatible image generation tool
 * This is the main tool that agents will use
 */
export function createImageGenerationTool(userId: string) {
  return createTool({
    name: 'generate_image',
    description: `Generate a product image or any other image using AI. Perfect for creating product photos, 
    hero images, backgrounds, or any visual content for websites. The generated image will be automatically 
    uploaded to cloud storage and you'll receive a URL that can be used directly in HTML/CSS code.
    
    WHEN TO USE:
    - User needs product images but doesn't have any (e.g., "shoe store", "furniture website")
    - Creating hero sections, backgrounds, or visual content
    - User asks for "generate images", "create product photos", "AI images"
    - Building e-commerce sites, portfolios, or any visual-heavy websites
    
    The generated image URL can be used in:
    - HTML: <img src="URL" alt="description" />
    - CSS: background-image: url('URL');
    - React/TSX: <img src="URL" />`,
    schema: z.object({
      prompt: z.string().describe(`Detailed description of the image to generate. Be specific about:
        - Subject (e.g., "red Nike running shoes")
        - Style (e.g., "professional product photo", "minimalist", "modern")
        - Background (e.g., "white background", "natural setting")
        - Lighting (e.g., "studio lighting", "natural light")
        - Angle (e.g., "front view", "45-degree angle")
        
        Example: "Professional product photo of red Nike running shoes on white background, studio lighting, front view, high quality"`),
      count: z.number().min(1).max(10).optional().default(1).describe('Number of images to generate (1-10). Default is 1.'),
      width: z.number().optional().default(1024).describe('Image width in pixels. Default is 1024.'),
      height: z.number().optional().default(1024).describe('Image height in pixels. Default is 1024.'),
    }),
    fn: async (args) => {
      const { prompt, count = 1, width = 1024, height = 1024 } = args;

      const options: Partial<ImageGenerationOptions> = {
        width,
        height,
      };

      // Generate single or multiple images based on count
      if (count === 1) {
        const result = await generateImage(prompt, userId, options);
        
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            imagePath: result.imagePath,
            message: 'Image generated successfully. You can now use this URL in your HTML/CSS code.',
            usage: {
              html: `<img src="${result.imageUrl}" alt="Generated image" />`,
              css: `background-image: url('${result.imageUrl}');`,
              react: `<img src="${result.imageUrl}" alt="Generated image" className="..." />`,
            },
          };
        } else {
          return {
            success: false,
            error: result.error,
            message: 'Failed to generate image. Please try again with a different prompt.',
          };
        }
      } else {
        // Generate multiple variations
        const prompts = Array(Math.min(count, 10)).fill(prompt);
        const results = await generateMultipleImages(prompts, userId, options);
        
        const successfulImages = results.filter(r => r.success);
        
        return {
          success: successfulImages.length > 0,
          totalRequested: count,
          totalGenerated: successfulImages.length,
          totalFailed: results.length - successfulImages.length,
          images: results.map((result, index) => ({
            index,
            success: result.success,
            imageUrl: result.imageUrl,
            imagePath: result.imagePath,
            error: result.error,
          })),
          imageUrls: successfulImages.map(r => r.imageUrl),
          message: `Generated ${successfulImages.length} out of ${count} images successfully.`,
        };
      }
    },
  });
}

/**
 * Export tool metadata for tool registry
 */
export const imageGenerationToolMetadata = {
  name: 'Image Generator',
  description: 'Generate AI images for websites using Stable Diffusion',
  category: 'GENERATION',
  capabilities: [
    'Generate product photos',
    'Create hero images',
    'Generate backgrounds',
    'Create visual content',
    'Multiple image generation',
    'Automatic cloud upload',
  ],
};
