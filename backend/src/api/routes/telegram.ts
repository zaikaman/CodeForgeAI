/**
 * Telegram authentication routes
 * Handles linking Telegram accounts to CodeForge accounts
 */

import { Router } from 'express';
import { supabase } from '../../storage/SupabaseClient';
import { z } from 'zod';
import { optionalAuth, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = Router();

// Validation schema for auth completion
const completeAuthSchema = z.object({
  token: z.string().min(1, 'Auth token is required'),
});

/**
 * POST /telegram/complete-auth
 * Complete Telegram authentication by linking telegram_id to user_id
 */
router.post('/telegram/complete-auth', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in first.',
      });
      return;
    }
    
    // Validate request
    const { token } = completeAuthSchema.parse(req.body);
    
    console.log('[Telegram Auth] Completing authentication for user:', userId);
    console.log('[Telegram Auth] Token:', token);
    
    // Find pending auth request
    const { data: pendingAuth, error: findError } = await supabase
      .from('telegram_auth_pending')
      .select('*')
      .eq('auth_token', token)
      .eq('completed', false)
      .single();
    
    if (findError || !pendingAuth) {
      console.error('[Telegram Auth] Pending auth not found:', findError);
      res.status(404).json({
        success: false,
        error: 'Authentication request not found or expired',
      });
      return;
    }
    
    // Check if expired
    const expiresAt = new Date(pendingAuth.expires_at);
    if (expiresAt < new Date()) {
      console.error('[Telegram Auth] Auth request expired');
      res.status(400).json({
        success: false,
        error: 'Authentication request expired. Please try again.',
      });
      return;
    }
    
    // Check if this Telegram account is already linked to another user
    const { data: existingUser } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', pendingAuth.telegram_id)
      .single();
    
    if (existingUser && existingUser.user_id !== userId) {
      res.status(400).json({
        success: false,
        error: 'This Telegram account is already linked to another user',
      });
      return;
    }
    
    // Link Telegram account to user
    const { data: telegramUser, error: linkError } = await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: pendingAuth.telegram_id,
        user_id: userId,
        username: pendingAuth.telegram_username,
        first_name: pendingAuth.first_name,
        last_name: pendingAuth.last_name,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (linkError) {
      console.error('[Telegram Auth] Failed to link account:', linkError);
      res.status(500).json({
        success: false,
        error: 'Failed to link Telegram account',
      });
      return;
    }
    
    // Mark auth as completed
    await supabase
      .from('telegram_auth_pending')
      .update({ completed: true })
      .eq('auth_token', token);
    
    console.log('[Telegram Auth] ✅ Successfully linked Telegram account');
    console.log('[Telegram Auth] User ID:', userId);
    console.log('[Telegram Auth] Telegram ID:', pendingAuth.telegram_id);
    
    // Send success message to Telegram
    try {
      const { getTelegramBot } = await import('../../services/TelegramBotService');
      const bot = getTelegramBot();
      
      // Get chat_id from context (stored when auth was initiated)
      const chatId = pendingAuth.telegram_id; // telegram_id IS the chat_id for private chats
      
      const successMessage = `
✅ **Authentication Successful!**

Your Telegram account has been successfully linked to CodeForge AI!

You can now:
• Send me messages to generate code
• Use /background for long-running tasks
• Use /status to check your jobs
• Use /help for more commands

Try sending me a message like:
"Create a React todo app"

Let's start coding! 🚀
      `.trim();
      
      await bot.sendJobCompletionNotification(
        chatId,
        'auth-success',
        userId,
        true,
        successMessage
      );
      
      console.log('[Telegram Auth] ✅ Success notification sent to Telegram');
    } catch (notifError: any) {
      console.error('[Telegram Auth] ⚠️ Failed to send notification:', notifError.message);
      // Don't fail the whole request if notification fails
    }
    
    res.json({
      success: true,
      data: {
        telegramUser: {
          id: telegramUser.id,
          telegram_id: telegramUser.telegram_id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
        },
      },
    });
    return;
    
  } catch (error: any) {
    console.error('[Telegram Auth] Error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete authentication',
    });
    return;
  }
});

/**
 * GET /telegram/status
 * Check if current user has a linked Telegram account
 */
router.get('/telegram/status', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    // Find linked Telegram account
    const { data: telegramUser, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !telegramUser) {
      res.json({
        success: true,
        data: {
          linked: false,
        },
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        linked: true,
        telegramUser: {
          id: telegramUser.id,
          telegram_id: telegramUser.telegram_id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
        },
      },
    });
    return;
    
  } catch (error: any) {
    console.error('[Telegram Status] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check Telegram status',
    });
    return;
  }
});

/**
 * DELETE /telegram/unlink
 * Unlink Telegram account from current user
 */
router.delete('/telegram/unlink', optionalAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    // Delete linked account
    const { error } = await supabase
      .from('telegram_users')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('[Telegram Unlink] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlink Telegram account',
      });
      return;
    }
    
    console.log('[Telegram Unlink] ✅ Successfully unlinked account for user:', userId);
    
    res.json({
      success: true,
      message: 'Telegram account unlinked successfully',
    });
    return;
    
  } catch (error: any) {
    console.error('[Telegram Unlink] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unlink Telegram account',
    });
    return;
  }
});

export default router;
