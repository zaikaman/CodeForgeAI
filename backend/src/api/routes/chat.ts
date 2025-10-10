import { Router } from 'express';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
import { ChatMemoryManager } from '../../services/ChatMemoryManager';
import { z } from 'zod';

const router = Router();

// Validation schema for chat request
const chatRequestSchema = z.object({
  generationId: z.string().min(1, 'Generation ID is required'),
  message: z.string().min(1, 'Message is required'),
  currentFiles: z.array(z.object({
    path: z.string(),
    content: z.string()
  })),
  language: z.string().default('typescript'),
  imageUrls: z.array(z.string()).optional(),
});

router.post('/chat', async (req, res): Promise<void> => {
  try {
    // Validate request body
    const validatedRequest = chatRequestSchema.parse(req.body);
    
    const { generationId, message, currentFiles, language, imageUrls } = validatedRequest;

    // Store user message in memory
    await ChatMemoryManager.storeMessage({
      generationId,
      role: 'user',
      content: message,
      imageUrls: imageUrls || [],
    });

    // Build context with conversation history
    const { contextMessage, totalTokens } = await ChatMemoryManager.buildContext(
      generationId,
      message,
      currentFiles,
      language,
      imageUrls
    );

    console.log(`📝 Chat context built: ${totalTokens} estimated tokens`);

    // Use ChatAgent for all requests
    const { runner } = await ChatAgent();
    
    // Build the message with images if provided
    let chatMessage: any;
    
    if (imageUrls && imageUrls.length > 0) {
      // Download images and convert to base64
      const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
          try {
            const response = await globalThis.fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            return {
              inline_data: {
                mime_type: contentType,
                data: base64
              }
            };
          } catch (error) {
            console.error(`Failed to fetch image from ${url}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed downloads
      const validImageParts = imageParts.filter(part => part !== null);
      
      // Build message with text and images (includes conversation history)
      const textPart = {
        text: contextMessage
      };
      
      chatMessage = {
        parts: [textPart, ...validImageParts]
      };
    } else {
      // Text-only message (includes conversation history)
      chatMessage = contextMessage;
    }

    const response = await runner.ask(chatMessage) as any;
    
    // Validate and sanitize response files
    if (response.files && Array.isArray(response.files)) {
      for (let i = 0; i < response.files.length; i++) {
        const file = response.files[i];
        
        // Ensure content is always a string
        if (typeof file.content !== 'string') {
          console.warn(`⚠ File ${file.path} has non-string content, converting...`);
          
          if (typeof file.content === 'object') {
            response.files[i].content = JSON.stringify(file.content, null, 2);
          } else {
            response.files[i].content = String(file.content);
          }
        } else {
          // Content is already a string, but check if it's a double-escaped JSON string
          // This happens when LLM returns already-stringified JSON content
          if (file.path.endsWith('.json') && file.content.startsWith('"') && file.content.endsWith('"')) {
            try {
              // Try to parse it once to remove outer quotes and unescape
              const unescaped = JSON.parse(file.content);
              if (typeof unescaped === 'string') {
                response.files[i].content = unescaped;
                console.log(`✓ Unescaped double-stringified content for ${file.path}`);
              }
            } catch (err) {
              // If parsing fails, keep original content
              console.warn(`⚠ Could not unescape content for ${file.path}, keeping as-is`);
            }
          }
        }
      }
    }
    
    // Merge modified/new files with existing files
    let updatedFiles: Array<{ path: string; content: string }> = [...currentFiles];
    
    if (response.files && Array.isArray(response.files) && response.files.length > 0) {
      const responseFilesMap = new Map<string, { path: string; content: string }>(
        response.files.map((f: any) => [f.path, f as { path: string; content: string }])
      );
      
      // Update existing files that were modified
      updatedFiles = currentFiles.map(originalFile => {
        const modifiedFile = responseFilesMap.get(originalFile.path);
        if (modifiedFile) {
          responseFilesMap.delete(originalFile.path);
          return modifiedFile;
        }
        return originalFile;
      });
      
      // Add any new files
      responseFilesMap.forEach((newFile: { path: string; content: string }) => {
        updatedFiles.push(newFile);
      });
    }

    // Store assistant response in memory
    await ChatMemoryManager.storeMessage({
      generationId,
      role: 'assistant',
      content: response.summary || 'Applied requested changes to the codebase',
      metadata: {
        filesModified: response.files?.length || 0,
      },
    });

    const responseData = {
      success: true,
      data: {
        files: updatedFiles,
        agentThought: {
          agent: 'ChatAgent',
          thought: response.summary || 'Applied requested changes to the codebase'
        }
      },
    };

    res.json(responseData);
    return;
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      error: error.message || 'Chat request failed',
    });
    return;
  }
});

export default router;
