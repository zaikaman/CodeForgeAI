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
import { chatQueue } from './ChatQueue';

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
  private isPolling = false;
  
  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
      return;
    }
    
    try {
      this.bot = new TelegramBot(token, { polling: false });
      console.log('✅ Telegram bot initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
  }
  
  /**
   * Start the bot (begin polling for messages)
   */
  async start() {
    if (!this.bot) {
      console.warn('⚠️  Telegram bot not initialized - skipping start');
      return;
    }
    
    if (this.isPolling) {
      console.log('⚠️  Telegram bot already polling');
      return;
    }
    
    try {
      // Start polling
      await this.bot.startPolling();
      this.isPolling = true;
      
      console.log('🤖 Telegram bot started polling');
      
      // Set up command handlers
      this.setupHandlers();
      
      // Get bot info
      const me = await this.bot.getMe();
      console.log(`✅ Bot username: @${me.username}`);
      
    } catch (error: any) {
      console.error('❌ Failed to start Telegram bot:', error.message);
    }
  }
  
  /**
   * Stop the bot
   */
  async stop() {
    if (!this.bot || !this.isPolling) {
      return;
    }
    
    try {
      await this.bot.stopPolling();
      this.isPolling = false;
      console.log('🛑 Telegram bot stopped');
    } catch (error: any) {
      console.error('❌ Failed to stop Telegram bot:', error.message);
    }
  }
  
  /**
   * Set up message and command handlers
   */
  private setupHandlers() {
    if (!this.bot) return;
    
    // /start command - Show welcome and login button
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg);
    });
    
    // /login command - Show login button
    this.bot.onText(/\/login/, async (msg) => {
      await this.handleLoginCommand(msg);
    });
    
    // /status command - Show active jobs
    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatusCommand(msg);
    });
    
    // /help command - Show help
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(msg);
    });
    
    // /background command - Toggle background mode for next request
    this.bot.onText(/\/background/, async (msg) => {
      await this.handleBackgroundCommand(msg);
    });
    
    // Handle all other messages (chat messages)
    this.bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text?.startsWith('/')) {
        return;
      }
      
      await this.handleChatMessage(msg);
    });
    
    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });
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
        `/status - Check your active jobs\n` +
        `/background - Toggle background mode`
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
✅ Background jobs for long tasks
✅ Real-time chat for quick tasks

**Commands:**
/start - Get started
/login - Link your account
/status - View active jobs
/background - Toggle background mode
/help - Show this help

**Usage:**
Just send me a message describing what you want to code!

**Background Mode:**
Use /background to enable background mode for the next request. This is useful for large projects that take time to complete.

**Examples:**
• "Create a React todo app"
• "Fix the bug in login.tsx"
• "Create a PR to add tests"
• "Build a landing page with dark mode"
    `.trim();
    
    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }
  
  /**
   * Handle /background command - Toggle background mode
   */
  private async handleBackgroundCommand(msg: TelegramBot.Message) {
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
    
    // Toggle background mode preference in database
    const { data: settings } = await supabase
      .from('telegram_settings')
      .select('background_mode')
      .eq('telegram_user_id', telegramUser.id)
      .single();
    
    // Get current background mode (default to false if not set)
    const currentBackgroundMode = settings?.background_mode ?? false;
    const newBackgroundMode = !currentBackgroundMode;
    
    console.log(`[Telegram] Toggle background mode for user ${telegramUser.user_id}:`);
    console.log(`  Current: ${currentBackgroundMode}`);
    console.log(`  New: ${newBackgroundMode}`);
    
    // Upsert settings and verify the result
    // Use onConflict to specify which column to use for the upsert (telegram_user_id has UNIQUE constraint)
    const { error: upsertError } = await supabase
      .from('telegram_settings')
      .upsert({
        telegram_user_id: telegramUser.id,
        background_mode: newBackgroundMode,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'telegram_user_id'
      });
    
    if (upsertError) {
      console.error('[Telegram] Failed to update background mode:', upsertError);
      await this.bot.sendMessage(chatId, '❌ Failed to update settings. Please try again.');
      return;
    }
    
    const emoji = newBackgroundMode ? '🔄' : '⚡';
    const mode = newBackgroundMode ? 'BACKGROUND' : 'REAL-TIME';
    const description = newBackgroundMode
      ? 'Your requests will now run in the background. You\'ll get a notification when they\'re done!'
      : 'Your requests will now run in real-time (faster for small tasks).';
    
    console.log(`[Telegram] Sending message: ${mode} mode activated`);
    
    await this.bot.sendMessage(
      chatId,
      `${emoji} **${mode} mode activated**\n\n${description}`,
      { parse_mode: 'Markdown' }
    );
  }
  
  /**
   * Handle regular chat messages (code requests)
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
    
    // Get background mode preference
    const { data: settings } = await supabase
      .from('telegram_settings')
      .select('background_mode')
      .eq('telegram_user_id', telegramUser.id)
      .single();
    
    const backgroundMode = settings?.background_mode ?? false;
    
    console.log(`[Telegram] Processing message from ${telegramUser.user_id}`);
    console.log(`[Telegram] Message: ${messageText.substring(0, 100)}...`);
    console.log(`[Telegram] Background mode: ${backgroundMode} (from settings: ${JSON.stringify(settings)})`);
    
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
      
      if (backgroundMode) {
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
        
      } else {
        // Real-time mode - use ChatQueue
        const jobId = randomUUID();
        
        // Create chat job
        await chatQueue.enqueue({
          id: jobId,
          generationId,
          userId: telegramUser.user_id,
          message: messageText,
          currentFiles: [],
          language: 'typescript',
          imageUrls: [],
        });
        
        console.log(`[Telegram] Chat job created: ${jobId}`);
        
        // Send initial message
        const statusMessage = await this.bot.sendMessage(
          chatId,
          `⚙️ Processing your request...\n\nJob ID: \`${jobId}\``,
          { parse_mode: 'Markdown' }
        );
        
        // Poll for job completion
        let attempts = 0;
        const maxAttempts = 150; // 150 * 2s = 5 minutes max
        let completed = false;
        
        while (!completed && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          
          const job = await chatQueue.getJob(jobId);
          
          if (job) {
            if (job.status === 'completed') {
              completed = true;
              
              // Edit status message
              await this.bot.editMessageText(
                `✅ **Request completed!**\n\nJob ID: \`${jobId}\``,
                {
                  chat_id: chatId,
                  message_id: statusMessage.message_id,
                  parse_mode: 'Markdown',
                }
              );
              
              // Send result
              const summary = job.result?.summary || 'Your request has been completed successfully!';
              await this.bot.sendMessage(chatId, summary);
              
              // If files were generated, send a link to view them
              if (job.result?.files && job.result.files.length > 0) {
                const webUrl = `${process.env.FRONTEND_URL || 'https://codeforge-adk.vercel.app'}/terminal/${generationId}`;
                await this.bot.sendMessage(
                  chatId,
                  `📁 **Generated ${job.result.files.length} files**\n\n` +
                  `View in web app: ${webUrl}`,
                  { parse_mode: 'Markdown' }
                );
              }
              
            } else if (job.status === 'error') {
              completed = true;
              
              await this.bot.editMessageText(
                `❌ **Request failed**\n\nJob ID: \`${jobId}\`\n\nError: ${job.error || 'Unknown error'}`,
                {
                  chat_id: chatId,
                  message_id: statusMessage.message_id,
                  parse_mode: 'Markdown',
                }
              );
            }
          }
        }
        
        if (!completed) {
          await this.bot.editMessageText(
            `⏱️ **Request timeout**\n\nJob ID: \`${jobId}\`\n\n` +
            `The request is taking longer than expected. ` +
            `Try using /background mode for long tasks.`,
            {
              chat_id: chatId,
              message_id: statusMessage.message_id,
              parse_mode: 'Markdown',
            }
          );
        }
      }
      
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
   * Escape special characters for Telegram Markdown
   */
  private escapeMarkdown(text: string): string {
    // Escape special Markdown characters
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
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
    
    // Escape the message content to prevent Markdown parsing errors
    const safeMessage = message ? this.escapeMarkdown(message) : '';
    
    const notification = `
${emoji} **Background job ${status}!**

Job ID: \`${jobId}\`

${safeMessage}

View in web app: ${webUrl}
    `.trim();
    
    try {
      await this.bot.sendMessage(chatId, notification, { parse_mode: 'Markdown' });
    } catch (error: any) {
      console.error('[Telegram] Failed to send notification:', error.message);
      
      // Fallback: Try sending without Markdown parsing
      try {
        const plainNotification = `
${emoji} Background job ${status}!

Job ID: ${jobId}

${message || ''}

View in web app: ${webUrl}
        `.trim();
        
        await this.bot.sendMessage(chatId, plainNotification);
      } catch (fallbackError: any) {
        console.error('[Telegram] Failed to send notification (fallback):', fallbackError.message);
      }
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

export function startTelegramBot() {
  const bot = getTelegramBot();
  bot.start();
  return bot;
}

export function stopTelegramBot() {
  if (botInstance) {
    botInstance.stop();
  }
}
