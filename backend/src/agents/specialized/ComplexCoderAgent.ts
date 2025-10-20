/**
 * ComplexCoderAgent - Advanced code generation for TypeScript/Frameworks
 * Full validation, compression, and best practices for complex projects
 * OPTIMIZED with prompt caching and parallel loading
 */

import { AgentBuilder } from '@iqai/adk';
import { generationSchema } from '../../schemas/generation-schema';
import { getLanguagePrompt } from '../../prompts/webcontainer-templates';
import { generateValidationPrompt, getAIChecklistPrompt } from '../../services/validation/PreValidationRules';
import { getPromptCache } from '../../utils/PromptCache';
import { smartCompress, getCompressionStats } from '../../utils/PromptCompression';
import { withGitHubIntegration, enhancePromptWithGitHub } from '../../utils/agentGitHubIntegration';
import { createImageGenerationTool } from '../../tools/generation/imageGenerationTool';
import type { GitHubToolsContext } from '../../utils/githubTools';

interface ComplexCoderOptions {
  language?: string;
  framework?: string;
  platform?: string;
  requirements?: string;
  githubContext?: GitHubToolsContext | null;
  userId?: string;
}

export const ComplexCoderAgent = async (options?: ComplexCoderOptions) => {
  const startTime = Date.now();
  
  // Complex languages: typescript, javascript, react, vue, etc.
  const targetLanguage = options?.language || 'typescript';
  
  console.log('[ComplexCoderAgent] Advanced mode for:', targetLanguage);
  console.log('[ComplexCoderAgent] Requirements:', options?.requirements?.substring(0, 100));
  
  const promptCache = getPromptCache();
  
  // Load all prompts in parallel
  const [systemPrompt, staticValidationRules, checklist] = await Promise.all([
    promptCache.getOrLoad(
      `complex:${targetLanguage}`,
      () => getLanguagePrompt(targetLanguage)
    ),
    promptCache.getOrLoad(
      `validation:${targetLanguage}`,
      () => generateValidationPrompt(targetLanguage)
    ),
    promptCache.getOrLoad(
      `checklist:${targetLanguage}`,
      () => getAIChecklistPrompt(targetLanguage)
    )
  ]);
  
  // Escape curly braces - ADK template engine might parse HTML attributes
  // We need to be careful with `alt` in HTML examples as ADK might treat it as a variable
  const escapeTemplate = (text: string) => {
    return text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{{$1}}');
  };
  
  const escapedSystemPrompt = escapeTemplate(systemPrompt);
  const escapedValidationRules = escapeTemplate(staticValidationRules);
  const escapedChecklist = escapeTemplate(checklist);
  
  // Enhance with GitHub tools
  const enhancedPrompt = enhancePromptWithGitHub(escapedSystemPrompt, options?.githubContext || null);
  
  // Add TypeScript-only restriction for ComplexCoderAgent
  const typeScriptOnlyRule = `

<complex_coder_restrictions>
  CRITICAL: ComplexCoderAgent can ONLY generate TypeScript-based applications.
  
  ❌ FORBIDDEN:
  - Simple HTML/CSS/JS applications (index.html + styles.css + script.js)
  - Vanilla JavaScript without build tools
  - Static websites without frameworks
  - Single-page HTML files with inline scripts
  
  ✅ REQUIRED:
  - Must use TypeScript (React, Vue, or other TypeScript frameworks)
  - Must have proper build configuration (Vite, package.json)
  - Must include TypeScript types and interfaces
  - Must use modern framework patterns (components, hooks, state management)
  - **MUST ALWAYS create a package.json file for EVERY TypeScript project**
  
  If the user requests a simple HTML app, you must:
  1. Respond with an error message explaining this agent only handles TypeScript projects
  2. Suggest they use the SimpleCoder agent instead for HTML/CSS/JS apps
  3. Do NOT attempt to generate the simple HTML app
  
  Example rejection response:
  {{
    "error": "ComplexCoderAgent can only generate TypeScript applications. For simple HTML/CSS/JS apps, please use the SimpleCoder agent instead. This agent is designed for complex projects using React, Vue, or other TypeScript frameworks."
  }}
  
  PACKAGE.JSON REQUIREMENT:
  Every TypeScript project MUST include a package.json file with:
  - "name": Project name (kebab-case)
  - "version": "1.0.0"
  - "type": "module" (for ES modules)
  - "scripts": Build, dev, test commands as appropriate
  - "dependencies": All required packages
  - "devDependencies": TypeScript, build tools, linters
  
  This is NON-NEGOTIABLE. If you're generating TypeScript code, you MUST create package.json.
</complex_coder_restrictions>
`;
  
  // Add images and generation support section
  const imagesAndGenerationSupport = `

<images_and_generation>
  **IMPORTANT:** You have access to TWO types of images in your TypeScript/React projects:
  
  1. UPLOADED IMAGES (User-provided):
     - If user uploaded images in chat, use them in your components
     - Already hosted on Supabase storage
     - Publicly accessible via provided URLs
     - Just use the exact URL in <img> tags or CSS
  
  2. AI-GENERATED IMAGES (generate_image tool):
     **CRITICAL**: You can now GENERATE product images using AI!
     
     ⚠️ **FORBIDDEN - DO NOT USE:**
     - ❌ Unsplash URLs (unsplash.com, images.unsplash.com)
     - ❌ Lorem Picsum (picsum.photos, loremflickr.com)
     - ❌ Placeholder.com
     - ❌ DummyImage.com
     - ❌ ANY external image URLs or CDNs
     - ❌ Stock photo websites
     
     ✅ **REQUIRED - ALWAYS USE:**
     - User-uploaded images (if provided)
     - generate_image tool (if images needed)
     
     WHEN TO USE generate_image:
     - User needs product images but has none (e.g., "shoe store", "furniture site")
     - Creating e-commerce, portfolio, or visual-heavy React apps
     - User asks for "generate images", "create product photos"
     - Building landing pages that need hero images or backgrounds
     - **ANY TIME images are needed and user hasn't uploaded any**
     
     HOW TO USE generate_image:
     {
       "name": "generate_image",
       "arguments": {
         "prompt": "Professional product photo of red Nike running shoes on white background, studio lighting, front view",
         "count": 1,
         "width": 1024,
         "height": 1024
       }
     }
     
     The tool returns an image URL that you can use in your React components.
     Example React component structure:
     - Import React
     - Create functional component with props
     - Use img tag with src={{generated-url}}, alt, and className props
     - Return JSX with proper styling
     
     PROMPT TIPS:
     - Be specific: "Professional product photo of [item] on [background], [lighting], [angle]"
     - Style keywords: "minimalist", "modern", "studio photo", "e-commerce style"
     - Background: "white background", "natural setting", "solid color"
     - Lighting: "studio lighting", "natural light", "soft shadows"
     
     EXAMPLES:
     - Shoe store: "Professional product photo of running shoes on white background, studio lighting"
     - Furniture site: "Modern minimalist chair, white background, soft shadows, front view"
     - Food website: "Gourmet burger on wooden table, natural lighting, close-up shot"
     - Fashion store: "T-shirt mockup on model, white background, professional photography"
     
     WORKFLOW:
     1. User requests a TypeScript/React website (e.g., "shoe store app")
     2. If no images uploaded → **MUST** use generate_image to create product images
     3. **CRITICAL**: Call generate_image tool **MULTIPLE TIMES** (3-6 calls) with **DIFFERENT PROMPTS**
        - Each call should generate 1 image with a UNIQUE product description
        - Example for shoe store:
          * Call 1: generate_image with prompt "Professional product photo of red Nike running shoes..."
          * Call 2: generate_image with prompt "Professional product photo of black leather dress shoes..."
          * Call 3: generate_image with prompt "Professional product photo of white sneakers..."
        - DO NOT call once with count > 1 and same prompt - that creates duplicates!
     4. Wait for each image URL to be returned before making the next call
     5. Embed ALL returned URLs in your React components with proper product names
     6. Style them properly with Tailwind or CSS modules
     
     TypeScript types for images:
     - Create ProductImageProps interface with: src (string), alt (string), className (optional string)
     - Create ProductImage component with React.FC<ProductImageProps> type
     - Component receives props: src, alt, className
     - Render img element with received props and loading="lazy" attribute
     
     **WHAT IF IMAGE GENERATION FAILS?**
     If image generation tool fails with an error like "temporarily unavailable" or "service down":
     1. DO NOT retry the tool
     2. Continue building the app WITHOUT the images
     3. Use CSS placeholders or skeleton loaders for images:
        - Create a Skeleton component with loading animation
        - Use CSS gradients for placeholder backgrounds
        - Build fully functional React app structure
     4. The website should still be complete and usable
     
     Example fallback component:
     const ImagePlaceholder: React.FC<alt: string> = (alt) => (
       <div style={{
         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         width: '100%',
         minHeight: '400px',
         borderRadius: '8px',
         color: 'white',
         fontSize: '18px'
       }}>
         (alt) Image Placeholder
       </div>
     );
     
     **ABSOLUTE RULES:**
     1. ❌ NEVER use Unsplash, Picsum, or any external image services
     2. ❌ NEVER use placeholder image generators
     3. ✅ ALWAYS use generate_image tool when images are needed
     4. ✅ ALWAYS use uploaded images if user provided them
     5. ✅ If image generation fails, continue without images (don't block the project)
     6. 🚨 If you include external image URLs, your response will be REJECTED
     
     Remember: 
     - Use uploaded images if provided by user
     - **MUST** try generate_image when user needs visuals but has none
     - Always use EXACT URLs returned by tools
     - Add proper TypeScript types
     - Consider lazy loading for performance
     - **If generation fails, continue the project anyway** (better to have code than nothing)
     - **NO external image services allowed**
</images_and_generation>
`;

  // Apply smart compression
  const combinedPrompt = enhancedPrompt + 
                         '\n\n' + escapedValidationRules + 
                         '\n\n' + escapedChecklist +
                         '\n\n' + typeScriptOnlyRule +
                         '\n\n' + imagesAndGenerationSupport;
  
  const finalPrompt = smartCompress(combinedPrompt);
  
  // Log compression stats
  const stats = getCompressionStats(combinedPrompt, finalPrompt);
  console.log(`[ComplexCoderAgent] Compressed: ${stats.originalSize} → ${stats.compressedSize} bytes (saved ${stats.savedPercent}%)`);
  
  const promptTime = Date.now() - startTime;
  console.log(`[ComplexCoderAgent] Prompt preparation: ${promptTime}ms`);
  console.log(`  - Language: ${targetLanguage}`);
  console.log(`  - Validation: ✓`);
  console.log(`  - Checklist: ✓`);
  
  let builder = AgentBuilder.create('ComplexCoderAgent')
    .withModel('gpt-5-mini-2025-08-07')
    .withInstruction(finalPrompt)
    .withOutputSchema(generationSchema);
  
  // Add image generation tool if userId is available
  if (options?.userId) {
    const imageGenTool = createImageGenerationTool(options.userId);
    builder = builder.withTools(imageGenTool);
    console.log('[ComplexCoderAgent] Image generation tool enabled');
  }
  
  // Add GitHub tools if context is available
  builder = withGitHubIntegration(builder, {
    githubContext: options?.githubContext || null,
    agentName: 'ComplexCoderAgent'
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`[ComplexCoderAgent] Total initialization: ${totalTime}ms`);
  
  return builder.build();
};
