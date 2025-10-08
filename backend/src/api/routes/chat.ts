import { Router } from 'express';
import { ChatAgent } from '../../agents/specialized/ChatAgent';
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
});

router.post('/chat', async (req, res): Promise<void> => {
  try {
    // Validate request body
    const validatedRequest = chatRequestSchema.parse(req.body);
    
    const { message, currentFiles, language } = validatedRequest;

    // Build context from current files
    const filesContext = currentFiles.map(f => 
      `File: ${f.path}\n\`\`\`${language}\n${f.content}\n\`\`\``
    ).join('\n\n');

    // Use ChatAgent for all requests
    const { runner } = await ChatAgent();
    
    const chatPrompt = `USER REQUEST: ${message}

CURRENT CODEBASE (${currentFiles.length} files):
${filesContext}`;

    const response = await runner.ask(chatPrompt) as any;
    
    // Merge modified/new files with existing files
    let updatedFiles = [...currentFiles];
    
    if (response.files && response.files.length > 0) {
      const responseFilesMap = new Map(response.files.map((f: any) => [f.path, f]));
      
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
      responseFilesMap.forEach(newFile => {
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
