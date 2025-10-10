/**
 * ChatMemoryManager - Manages conversation history for chat sessions
 * 
 * Strategy:
 * - Keep last 20 messages in full detail
 * - Store all messages in DB for audit trail
 * - Optimize token usage while maintaining context
 */

import { supabase } from '../storage/SupabaseClient';

interface ChatMessage {
  id?: string;
  generationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrls?: string[];
  tokenCount?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export class ChatMemoryManager {
  private static readonly MAX_MESSAGES = 20;
  private static readonly APPROX_TOKENS_PER_CHAR = 0.25; // rough estimate

  /**
   * Store a message in the database
   */
  static async storeMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const tokenCount = message.tokenCount || this.estimateTokens(message.content);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          generation_id: message.generationId,
          role: message.role,
          content: message.content,
          image_urls: message.imageUrls || [],
          token_count: tokenCount,
          metadata: message.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to store chat message:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error storing chat message:', error);
      return null;
    }
  }

  /**
   * Get recent messages for a generation (last N messages)
   */
  static async getRecentMessages(generationId: string, limit: number = this.MAX_MESSAGES): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('generation_id', generationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch chat messages:', error);
        return [];
      }

      // Reverse to get chronological order (oldest first)
      return (data || [])
        .reverse()
        .map(msg => ({
          id: msg.id,
          generationId: msg.generation_id,
          role: msg.role,
          content: msg.content,
          imageUrls: msg.image_urls || [],
          tokenCount: msg.token_count,
          metadata: msg.metadata || {},
          createdAt: msg.created_at,
        }));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  /**
   * Get all messages for a generation (for full history view)
   */
  static async getAllMessages(generationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('generation_id', generationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch all chat messages:', error);
        return [];
      }

      return (data || []).map(msg => ({
        id: msg.id,
        generationId: msg.generation_id,
        role: msg.role,
        content: msg.content,
        imageUrls: msg.image_urls || [],
        tokenCount: msg.token_count,
        metadata: msg.metadata || {},
        createdAt: msg.created_at,
      }));
    } catch (error) {
      console.error('Error fetching all chat messages:', error);
      return [];
    }
  }

  /**
   * Build context for ChatAgent with recent message history
   */
  static async buildContext(
    generationId: string,
    currentMessage: string,
    currentFiles: Array<{ path: string; content: string }>,
    language: string,
    _imageUrls?: string[]
  ): Promise<{ contextMessage: string; totalTokens: number }> {
    // Get recent messages (last 20)
    const recentMessages = await this.getRecentMessages(generationId, this.MAX_MESSAGES);

    // Build conversation history
    let conversationHistory = '';
    let historyTokens = 0;

    if (recentMessages.length > 0) {
      conversationHistory = '\n\n=== CONVERSATION HISTORY (Last 20 messages) ===\n\n';
      
      for (const msg of recentMessages) {
        const timestamp = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : '';
        conversationHistory += `[${timestamp}] ${msg.role.toUpperCase()}: ${msg.content}\n`;
        
        if (msg.imageUrls && msg.imageUrls.length > 0) {
          conversationHistory += `  (with ${msg.imageUrls.length} image(s))\n`;
        }
        conversationHistory += '\n';
        
        historyTokens += msg.tokenCount || this.estimateTokens(msg.content);
      }
      
      conversationHistory += '=== END CONVERSATION HISTORY ===\n\n';
    }

    // Build current files context
    const filesContext = currentFiles
      .map(f => `File: ${f.path}\n\`\`\`${language}\n${f.content}\n\`\`\``)
      .join('\n\n');

    const filesTokens = this.estimateTokens(filesContext);

    // Build final context message
    const contextMessage = `${conversationHistory}USER REQUEST: ${currentMessage}

CURRENT CODEBASE (${currentFiles.length} files):
${filesContext}`;

    const totalTokens = historyTokens + filesTokens + this.estimateTokens(currentMessage) + 100; // +100 for overhead

    return {
      contextMessage,
      totalTokens,
    };
  }

  /**
   * Estimate token count from text (rough approximation)
   * Real implementation should use tiktoken or similar
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length * this.APPROX_TOKENS_PER_CHAR);
  }

  /**
   * Get message count for a generation
   */
  static async getMessageCount(generationId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('generation_id', generationId);

      if (error) {
        console.error('Failed to count messages:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting messages:', error);
      return 0;
    }
  }

  /**
   * Delete all messages for a generation
   */
  static async deleteMessages(generationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('generation_id', generationId);

      if (error) {
        console.error('Failed to delete messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
  }
}
