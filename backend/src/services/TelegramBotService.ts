/**
 * TelegramBotService - Telegram bot integration for CodeForge AI
 * 
 * FEATURES:
 * - Accept chat messages from users
 * - Support both background and non-background jobs
 * - Deep link authentication to web interface
 * - Full ChatAgent capabilities (routing, GitHub ops, code gen, etc.)
 */

import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../storage/SupabaseClient';
import { randomUUID } from 'crypto';
import { ChatMemoryManager } from './ChatMemoryManager';

interface TelegramUser {
  id: string;
  telegram_id: number;
  user_id: string; // Supabase user ID
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private webhookUrl: string | null = null;
  
  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
      return;
    }
    
    try {
      // Initialize bot WITHOUT polling - we'll use webhook
      this.bot = new TelegramBot(token, { polling: false });
      console.log('✅ Telegram bot initialized (webhook mode)');
    } catch (error: any) {
      console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
  }
  
  /**
   * Set up webhook for receiving updates from Telegram
   * Auto-detects Heroku URL or uses provided URL
   */
  async setupWebhook(customUrl?: string) {
    if (!this.bot) {
      console.warn('⚠️  Telegram bot not initialized - skipping webhook setup');
      return;
    }
    
    try {
      // Auto-detect webhook URL from Heroku environment
      let baseUrl = customUrl;
      
      if (!baseUrl) {
        // Try Heroku app name first
        const herokuAppName = process.env.HEROKU_APP_NAME;
        if (herokuAppName) {
          baseUrl = `https://${herokuAppName}.herokuapp.com`;
        } else {
          // Try to get from environment variable
          baseUrl = process.env.APP_URL || process.env.BACKEND_URL;
        }
      }
      
      if (!baseUrl) {
        console.error('❌ Cannot setup webhook: No URL provided and HEROKU_APP_NAME not set');
        console.warn('💡 Set HEROKU_APP_NAME or APP_URL environment variable');
        return;
      }
      
      // Build webhook URL
      this.webhookUrl = `${baseUrl}/api/telegram/webhook`;
      
      console.log(`🔗 Setting up Telegram webhook at: ${this.webhookUrl}`);
      
      // Set webhook with Telegram
      const result = await this.bot.setWebHook(this.webhookUrl);
      
      if (result) {
        console.log('✅ Telegram webhook configured successfully');
        
        // Verify webhook
        const webhookInfo = await this.bot.getWebHookInfo();
        console.log('📋 Webhook info:', {
          url: webhookInfo.url,
          has_custom_certificate: webhookInfo.has_custom_certificate,
          pending_update_count: webhookInfo.pending_update_count,
        });
      } else {
        console.error('❌ Failed to set webhook');
      }
      
      // Set up command handlers (same as before, but they work with webhook too)
      this.setupHandlers();
      
      // Get bot info
      const me = await this.bot.getMe();
      console.log(`✅ Bot username: @${me.username}`);
      
    } catch (error: any) {
      console.error('❌ Failed to setup Telegram webhook:', error.message);
    }
  }
  
  /**
   * Process incoming webhook update from Telegram
   * This is called by the webhook endpoint when Telegram sends an update
   */
  async processUpdate(update: any) {
    if (!this.bot) {
      console.warn('⚠️  Bot not initialized, cannot process update');
      return;
    }
    
    try {
      console.log('[TelegramBot] Processing update type:', update.message ? 'message' : update.callback_query ? 'callback_query' : 'unknown');
      
      // IMPORTANT: With webhook mode, we need to manually emit events
      // because processUpdate() doesn't automatically trigger handlers
      
      if (update.message) {
        const msg = update.message;
        console.log('[TelegramBot] Message text:', msg.text);
        
        // Check if it's a command
        if (msg.text?.startsWith('/')) {
          console.log('[TelegramBot] Command detected:', msg.text);
          
          // Route to appropriate handler based on command
          if (msg.text === '/start') {
            await this.handleStartCommand(msg);
          } else if (msg.text === '/login') {
            await this.handleLoginCommand(msg);
          } else if (msg.text === '/status') {
            await this.handleStatusCommand(msg);
          } else if (msg.text === '/help') {
            await this.handleHelpCommand(msg);
          }
        } else {
          // Regular message (not a command)
          console.log('[TelegramBot] Regular message, routing to chat handler');
          await this.handleChatMessage(msg);
        }
      } else if (update.callback_query) {
        console.log('[TelegramBot] Callback query detected:', update.callback_query.data);
        await this.handleCallbackQuery(update.callback_query);
      }
      
      console.log('[TelegramBot] ✅ Update processed successfully');
    } catch (error: any) {
      console.error('❌ Error processing Telegram update:', error.message);
      console.error('Update details:', JSON.stringify(update, null, 2));
    }
  }
  
  /**
   * Remove webhook and delete pending updates
   */
  async removeWebhook() {
    if (!this.bot) {
      return;
    }
    
    try {
      await this.bot.deleteWebHook();
      console.log('🗑️  Telegram webhook removed');
    } catch (error: any) {
      console.error('❌ Failed to remove webhook:', error.message);
    }
  }
  
  /**
   * Set up message and command handlers
   */
  private setupHandlers() {
    if (!this.bot) return;
    
    console.log('[TelegramBot] Setting up message handlers...');
    
    // /start command - Show welcome and login button
    this.bot.onText(/\/start/, async (msg) => {
      console.log('[TelegramBot] /start command received');
      await this.handleStartCommand(msg);
    });
    
    // /login command - Show login button
    this.bot.onText(/\/login/, async (msg) => {
      console.log('[TelegramBot] /login command received');
      await this.handleLoginCommand(msg);
    });
    
    // /status command - Show active jobs
    this.bot.onText(/\/status/, async (msg) => {
      console.log('[TelegramBot] /status command received');
      await this.handleStatusCommand(msg);
    });
    
    // /help command - Show help
    this.bot.onText(/\/help/, async (msg) => {
      console.log('[TelegramBot] /help command received');
      await this.handleHelpCommand(msg);
    });
    
    // Handle all other messages (chat messages)
    this.bot.on('message', async (msg) => {
      console.log('[TelegramBot] Message received:', msg.text?.substring(0, 50));
      
      // Skip if it's a command
      if (msg.text?.startsWith('/')) {
        console.log('[TelegramBot] Skipping command message (already handled)');
        return;
      }
      
      await this.handleChatMessage(msg);
    });
    
    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      console.log('[TelegramBot] Callback query received:', query.data);
      await this.handleCallbackQuery(query);
    });
    
    console.log('[TelegramBot] ✅ All handlers registered');
  }
  
  /**
   * Handle /start command
   */
  private async handleStartCommand(msg: TelegramBot.Message) {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    
    if (!telegramId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user');
      return;
    }
    
    // Check if user is already linked
    const telegramUser = await this.getTelegramUser(telegramId);
    
    if (telegramUser) {
      // User is already linked
      await this.bot.sendMessage(
        chatId,
        `👋 Welcome back, ${msg.from?.first_name || 'there'}!\n\n` +
        `You're already signed in to CodeForge AI.\n\n` +
        `Send me any message to start coding, or use:\n` +
        `/help - See all commands\n` +
        `/status - Check your active jobs`
      );
    } else {
      // User needs to sign in
      await this.sendLoginButton(chatId, msg.from);
    }
  }
  
  /**
   * Handle /login command
   */
  private async handleLoginCommand(msg: TelegramBot.Message) {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    await this.sendLoginButton(chatId, msg.from);
  }
  
  /**
   * Handle /status command - Show active jobs
   */
  private async handleStatusCommand(msg: TelegramBot.Message) {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    
    if (!telegramId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user');
      return;
    }
    
    // Check if user is linked
    const telegramUser = await this.getTelegramUser(telegramId);
    
    if (!telegramUser) {
      await this.sendLoginButton(chatId, msg.from);
      return;
    }
    
    // Get active jobs from database
    const { data: jobs, error } = await supabase
      .from('background_jobs')
      .select('id, type, status, user_message, progress, created_at')
      .eq('user_id', telegramUser.user_id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching jobs:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch jobs');
      return;
    }
    
    if (!jobs || jobs.length === 0) {
      await this.bot.sendMessage(chatId, '✅ No active jobs');
      return;
    }
    
    // Format jobs list
    let message = '📋 **Active Jobs:**\n\n';
    
    for (const job of jobs) {
      const emoji = job.status === 'pending' ? '⏳' : '⚙️';
      const statusText = job.status === 'pending' ? 'Pending' : `Processing (${job.progress}%)`;
      const messagePreview = job.user_message.substring(0, 50) + (job.user_message.length > 50 ? '...' : '');
      
      message += `${emoji} **${statusText}**\n`;
      message += `   ID: \`${job.id}\`\n`;
      message += `   ${messagePreview}\n\n`;
    }
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
  
  /**
   * Handle /help command
   */
  private async handleHelpCommand(msg: TelegramBot.Message) {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    
    const helpText = `
🤖 **CodeForge AI Telegram Bot**

I can help you with:
✅ Code generation (React, Next.js, Vue, etc.)
✅ Code modifications and bug fixes
✅ GitHub operations (PRs, issues, etc.)
✅ Background job processing

**Commands:**
/start - Get started
/login - Link your account
/status - View active jobs
/help - Show this help

**Usage:**
Just send me a message describing what you want to code!

All requests run in **background mode** - you'll get a notification when they're done! 🔔

**Examples:**
• "Create a React todo app"
• "Fix the bug in login.tsx"
• "Create a PR to add tests"
• "Build a landing page with dark mode"
    `.trim();
    
    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
  
  /**
   * Handle regular chat messages (code requests)
   * All requests now run in background mode
   */
  private async handleChatMessage(msg: TelegramBot.Message) {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;
    const messageText = msg.text;
    
    if (!telegramId || !messageText) {
      return;
    }
    
    // Check if user is linked
    const telegramUser = await this.getTelegramUser(telegramId);
    
    if (!telegramUser) {
      await this.sendLoginButton(chatId, msg.from);
      return;
    }
    
    console.log(`[Telegram] Processing message from ${telegramUser.user_id}`);
    console.log(`[Telegram] Message: ${messageText.substring(0, 100)}...`);
    console.log(`[Telegram] Mode: BACKGROUND (default)`);
    
    // Send "typing" indicator
    await this.bot.sendChatAction(chatId, 'typing');
    
    try {
      // Create a new generation for this request
      const generationId = randomUUID();
      
      // Create generation record
      const { error: createError } = await supabase
        .from('generations')
        .insert({
          id: generationId,
          user_id: telegramUser.user_id,
          prompt: messageText.slice(0, 500),
          target_language: 'typescript',
          complexity: 'moderate',
          status: 'processing',
          files: [],
          created_at: new Date().toISOString(),
        });
      
      if (createError) {
        console.error('Failed to create generation:', createError);
        await this.bot.sendMessage(chatId, '❌ Failed to create job session');
        return;
      }
      
      // Store user message in chat history
      const userMessageId = await ChatMemoryManager.storeMessage({
        generationId,
        role: 'user',
        content: messageText,
        imageUrls: [],
      });
      
      if (!userMessageId) {
        console.error('Failed to store user message');
      }
      
      // Always use background mode
      // Create background job
      const { data: job, error: jobError } = await supabase
        .from('background_jobs')
        .insert({
          user_id: telegramUser.user_id,
          session_id: generationId,
          type: 'agent_task',
          status: 'pending',
          user_message: messageText,
          context: {
            files: [],
            fileContents: [],
            language: 'typescript',
            telegram_chat_id: chatId, // Store chat ID for notifications
          },
          progress: 0,
        })
        .select()
        .single();
      
      if (jobError || !job) {
        console.error('Failed to create background job:', jobError);
        await this.bot.sendMessage(chatId, '❌ Failed to create background job');
        return;
      }
      
      console.log(`[Telegram] Background job created: ${job.id}`);
      
      // Send confirmation message
      await this.bot.sendMessage(
        chatId,
        `🚀 **Background job started!**\n\n` +
        `Job ID: \`${job.id}\`\n\n` +
        `I'm working on your request in the background. ` +
        `You can continue chatting or use /status to check progress.\n\n` +
        `I'll notify you when it's done! 🔔`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error: any) {
      console.error('[Telegram] Error processing message:', error);
      await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }
  
  /**
   * Handle callback queries (button clicks)
   */
  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    if (!this.bot) return;
    
    const chatId = query.message?.chat.id;
    const data = query.data;
    
    if (!chatId || !data) return;
    
    // Answer callback query to remove loading state
    await this.bot.answerCallbackQuery(query.id);
    
    // Handle different callback actions
    if (data === 'refresh_status') {
      await this.handleStatusCommand(query.message as TelegramBot.Message);
    }
  }
  
  /**
   * Send login button with deep link
   */
  private async sendLoginButton(chatId: number, user?: TelegramBot.User) {
    if (!this.bot) return;
    
    const firstName = user?.first_name || 'there';
    const telegramId = user?.id;
    
    if (!telegramId) {
      await this.bot.sendMessage(chatId, '❌ Unable to identify user');
      return;
    }
    
    // Generate a unique auth token for this Telegram user
    const authToken = randomUUID();
    
    // Store pending auth in database
    await supabase
      .from('telegram_auth_pending')
      .insert({
        telegram_id: telegramId,
        telegram_username: user?.username,
        first_name: user?.first_name,
        last_name: user?.last_name,
        auth_token: authToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });
    
    // Create deep link to web app
    const webUrl = process.env.FRONTEND_URL || 'https://codeforge-adk.vercel.app';
    const authUrl = `${webUrl}/telegram-auth?token=${authToken}`;
    
    const message = `
👋 Hello ${firstName}!

To use CodeForge AI via Telegram, you need to sign in to our web interface first.

Why sign in?
• Link your Telegram account to your CodeForge account
• Access your projects and generation history
• Sync between web and Telegram

It's quick and secure! 🔒

Click the button below to sign in:
    `.trim();
    
    await this.bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔐 Sign In to CodeForge',
              url: authUrl,
            },
          ],
        ],
      },
    });
  }
  
  /**
   * Get Telegram user by telegram_id
   */
  private async getTelegramUser(telegramId: number): Promise<TelegramUser | null> {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as TelegramUser;
  }
  
  /**
   * Send notification to a Telegram user
   * (Called from background job processor when job completes)
   */
  async sendJobCompletionNotification(
    chatId: number,
    jobId: string,
    generationId: string,
    success: boolean,
    message?: string
  ) {
    if (!this.bot) return;
    
    const emoji = success ? '✅' : '❌';
    const status = success ? 'completed' : 'failed';
    const webUrl = `${process.env.FRONTEND_URL || 'https://codeforge-adk.vercel.app'}/terminal/${generationId}`;
    
    // Send notification without Markdown to avoid parsing errors with special characters
    const notification = `
${emoji} Background job ${status}!

Job ID: ${jobId}

${message || ''}

View in web app: ${webUrl}
    `.trim();
    
    try {
      await this.bot.sendMessage(chatId, notification);
    } catch (error: any) {
      console.error('[Telegram] Failed to send notification:', error.message);
    }
  }
}

// Singleton instance
let botInstance: TelegramBotService | null = null;

export function getTelegramBot(): TelegramBotService {
  if (!botInstance) {
    botInstance = new TelegramBotService();
  }
  return botInstance;
}

/**
 * Setup Telegram webhook (replaces startTelegramBot for webhook mode)
 */
export async function setupTelegramWebhook(customUrl?: string) {
  const bot = getTelegramBot();
  await bot.setupWebhook(customUrl);
  return bot;
}

/**
 * Remove Telegram webhook
 */
export async function removeTelegramWebhook() {
  if (botInstance) {
    await botInstance.removeWebhook();
  }
}
