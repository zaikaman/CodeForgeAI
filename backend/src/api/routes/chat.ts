import { Router } from 'express';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
import { z } from 'zod';
import fetch from 'node-fetch';

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
    
    const { message, currentFiles, language, imageUrls } = validatedRequest;

    // Build context from current files
    const filesContext = currentFiles.map(f => 
      `File: ${f.path}\n\`\`\`${language}\n${f.content}\n\`\`\``
    ).join('\n\n');

    // Use ChatAgent for all requests
    const { runner } = await ChatAgent();
    
    // Build the message with images if provided
    let chatMessage: any;
    
    if (imageUrls && imageUrls.length > 0) {
      // Download images and convert to base64
      const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            const buffer = await response.buffer();
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
      
      // Build message with text and images
      const textPart = {
        text: `USER REQUEST: ${message}

CURRENT CODEBASE (${currentFiles.length} files):
${filesContext}`
      };
      
      chatMessage = {
        parts: [textPart, ...validImageParts]
      };
    } else {
      // Text-only message
      chatMessage = `USER REQUEST: ${message}

CURRENT CODEBASE (${currentFiles.length} files):
${filesContext}`;
    }

    const response = await runner.ask(chatMessage) as any;
    
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
