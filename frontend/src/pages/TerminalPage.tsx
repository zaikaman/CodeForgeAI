import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
import { ProjectWorkspace } from '../components/ProjectWorkspace';
import { DeployButton } from '../components/DeployButton';
import { SettingsModal } from '../components/SettingsModal';
import { BackgroundJobsPanel } from '../components/BackgroundJobsPanel';
import { VapiCallAgent } from '../components/VapiCallAgent';
import { useGenerationStore } from '../stores/generationStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRealtimeJob } from '../hooks/useRealtimeJob';
import { useRealtimeJobsList } from '../hooks/useRealtimeJobsList';
import { useSoundEffects } from '../hooks/useSoundEffects';
import apiClient from '../services/apiClient';
import { uploadMultipleFiles, validateFile } from '../services/fileUploadService';
import '../styles/theme.css';
import './TerminalPage.css';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

export const TerminalPage: React.FC = () => {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('generation') || routeId; // Support both query param and route param
  const navigate = useNavigate();
  const { user, session } = useAuthContext();
  const { showToast } = useUIStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sidebar State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showBackgroundJobs, setShowBackgroundJobs] = useState(false);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  
  // UI State
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'preview' | 'deploy'>('source');
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPreviewPanelVisible, setIsPreviewPanelVisible] = useState(true);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessages, setProgressMessages] = useState<Array<{
    timestamp: string;
    agent: string;
    status: 'started' | 'completed' | 'error';
    message: string;
  }>>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // Deployment State
  const [deploymentData, setDeploymentData] = useState<{
    url: string | null;
    status: 'pending' | 'deploying' | 'deployed' | 'failed' | null;
  }>({ url: null, status: null });
  

  
  // Sound effects
  const { playClick, playTabSwitch, playToggle, playType } = useSoundEffects();
  const lastTypeTimeRef = useRef<number>(0);

  // Store
  const store = useGenerationStore();
  const { 
    currentGeneration, 
    getGenerationById, 
    updateGenerationFiles, 
    history,
    startGenerationWithId,
    clearCurrent
  } = store;

  // Get current generation if ID exists
  // IMPORTANT: Include history in dependencies to re-render when files are updated
  const generation = React.useMemo(() => {
    if (!id) return null;
    const gen = currentGeneration?.id === id ? currentGeneration : getGenerationById(id);
    console.log(`[TerminalPage] Generation memo updated for ${id}:`, {
      hasFiles: !!gen?.response?.files,
      filesCount: gen?.response?.files?.length || 0
    });
    return gen;
  }, [id, currentGeneration, getGenerationById, history]);

  // Realtime active jobs updates (no polling!)
  useRealtimeJobsList({
    enabled: !!user,
    onActiveJobsChange: (count) => {
      setActiveJobsCount(count);
    },
  });

  // Load chat sessions - reload when ID changes (NOT on every message)
  useEffect(() => {
    if (!user) return;

    const loadChatSessions = async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('id, prompt, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const sessions: ChatSession[] = data.map(gen => ({
          id: gen.id,
          title: gen.prompt?.slice(0, 50) || 'Untitled Chat',
          preview: gen.prompt?.slice(0, 100) || 'No content',
          timestamp: new Date(gen.created_at),
        }));
        setChatSessions(sessions);
      }
    };

    loadChatSessions();
  }, [user, id]); // Only reload when user or session ID changes

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Close sidebar when clicking outside (on mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('.chat-history-sidebar');
      const button = document.querySelector('.btn-menu-toggle');
      
      if (isSidebarVisible && sidebar && button && 
          !sidebar.contains(e.target as Node) && 
          !button.contains(e.target as Node)) {
        setIsSidebarVisible(false);
      }
    };

    // Add backdrop class to body
    if (isSidebarVisible) {
      document.body.classList.add('sidebar-open');
      document.addEventListener('click', handleClickOutside);
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.classList.remove('sidebar-open');
    };
  }, [isSidebarVisible]);

  // Matrix rain effect for welcome screen
  useEffect(() => {
    if (messages.length > 0) return; // Only show on empty chat

    const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]<>+-*/=アイウエオカキクケコサシスセソタチツテト'.split('');
    const fontSize = 16; // Increased font size for better visibility
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    let animationId: number;
    const draw = () => {
      // Darker fade for more contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`; // Bold for better visibility

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // More vibrant colors with better gradients
        if (drops[i] * fontSize > canvas.height * 0.95) {
          // Brightest at bottom
          ctx.fillStyle = '#00FF00';
          ctx.shadowColor = '#00FF00';
          ctx.shadowBlur = 10;
        } else {
          // Gradient effect from top to bottom
          const opacity = Math.min(1, (drops[i] * fontSize) / (canvas.height * 0.8));
          ctx.fillStyle = `rgba(0, 255, 0, ${opacity * 0.9})`;
          ctx.shadowColor = '#00FF00';
          ctx.shadowBlur = 5;
        }
        
        ctx.fillText(text, x, y);

        // Reset shadow for next iteration
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [messages.length]);

  // Use realtime WebSocket updates (no polling!)
  useRealtimeJob({
    jobId: currentJobId,
    enabled: isProcessing && !!currentJobId,
    fallbackToPolling: true, // Auto-fallback if WebSocket fails
    onProgress: (data) => {
      console.log('📊 Progress update received:', data);
      
      // Handle progress messages array (from chat:progress event)
      if (data.progressMessages && Array.isArray(data.progressMessages)) {
        console.log('📝 Updating progress messages:', data.progressMessages.length);
        setProgressMessages(data.progressMessages);
      }
      
      // Handle individual progress updates (from job:progress event)
      if (data.message && data.agent) {
        console.log('📝 Adding individual progress message:', { agent: data.agent, message: data.message });
        const newProgress = {
          timestamp: data.timestamp || new Date().toISOString(),
          agent: data.agent,
          status: data.status || 'processing',
          message: data.message,
        };
        
        // Append to existing progress messages
        setProgressMessages(prev => [...prev, newProgress]);
      }
    },
    onComplete: (result) => {
      console.log('✅ Chat job completed:', result);
      
      // Prevent duplicate completions
      setIsProcessing(false);
      
      // Clear progress messages and job ID
      setCurrentJobId(null);
      setProgressMessages([]);

      // Add agent response message
      const agentResponseMessage: AgentMessage = {
        id: `msg_${Date.now()}_agent`,
        agent: result.agent,
        role: 'agent',
        content: result.summary,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponseMessage]);

      // Add suggestions if any
      if (result.suggestions && result.suggestions.length > 0) {
        const suggestionsMessage: AgentMessage = {
          id: `msg_${Date.now()}_suggestions`,
          agent: 'System',
          role: 'system',
          content: `💡 Suggestions:\n${result.suggestions.map((s: string) => `  • ${s}`).join('\n')}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, suggestionsMessage]);
      }

      // Update files if present AND ensure panel becomes visible
      if (result.files && id) {
        console.log(`📦 Updating generation ${id} with ${result.files.length} files`);
        console.log('Files received:', result.files.map((f: any) => f.path));
        
        // Update the generation with files
        updateGenerationFiles(id, result.files);
        
        // Force panel to be visible when files are ready
        setIsPreviewPanelVisible(true);
        
        // Select first file automatically
        if (selectedFile) {
          const updatedFile = result.files.find((f: any) => f.path === selectedFile.path);
          if (updatedFile) {
            setSelectedFile(updatedFile);
          }
        } else if (result.files.length > 0) {
          // Auto-select first file if no file is selected
          console.log('Auto-selecting first file:', result.files[0].path);
          setSelectedFile(result.files[0]);
        }
        
        // Log verification
        setTimeout(() => {
          const gen = getGenerationById(id);
          console.log('Verification - Generation after update:', {
            hasGeneration: !!gen,
            hasResponse: !!gen?.response,
            hasFiles: !!gen?.response?.files,
            filesCount: gen?.response?.files?.length || 0
          });
        }, 100);
      }
      // If no files in result, they should be loaded by loadSession effect
      // Don't load here to avoid duplication
      else if (!result.files && id) {
        console.log('ℹ️ No files in result, they will be loaded by loadSession effect');
      }

      // 🔄 Check if this is a code generation completion (SimpleCoder, ComplexCoder, or CodeModification)
      const codingAgents = ['SimpleCoder', 'ComplexCoder', 'CodeModification', 'SimpleCoderAgent', 'ComplexCoderAgent', 'CodeModificationAgent'];
      if (result.agent && codingAgents.includes(result.agent) && result.files && result.files.length > 0) {
        console.log(`🔄 ${result.agent} finished coding - performing soft refresh in 2 seconds...`);
        
        // Show notification message
        const refreshNotification: AgentMessage = {
          id: `msg_${Date.now()}_refresh`,
          agent: 'System',
          role: 'system',
          content: '✨ Code generation complete! Starting new session in 2 seconds...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, refreshNotification]);
        
        // Wait 2 seconds to let user see the result, then refresh page
        setTimeout(() => {
          handlePageRefresh();
        }, 100);
      }
    },
    onError: (error) => {
      console.error('❌ Chat job failed:', error);
      
      // Clear progress tracking on error
      setCurrentJobId(null);
      setProgressMessages([]);
      
      const errorMessage: AgentMessage = {
        id: `msg_${Date.now()}_error`,
        agent: 'System',
        role: 'system',
        content: `❌ Error: ${error || 'Failed to process your request. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setIsProcessing(false);
    },
  });

  // Handle scroll to detect if user manually scrolled
  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Load existing session if ID is provided
  useEffect(() => {
    if (!id) {
      // Clear messages when no ID (new chat)
      setMessages([]);
      return;
    }

    // Check if generation already exists in memory (newly created)
    const existingGeneration = getGenerationById(id);
    if (existingGeneration) {
      console.log(`📂 Session ${id} already loaded in memory, but still loading messages from DB...`);
      // Don't return here! We still need to load messages from DB
    }

    // Load session from DB (always load messages, even if generation exists)
    const loadSession = async () => {
      try {
        console.log(`📂 Loading session ${id} from database...`);
        
        const { data: generationData, error: dbError } = await supabase
          .from('generations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (dbError || !generationData) {
          console.error('❌ Failed to load session:', dbError);
          return;
        }
        
        console.log('✅ Loaded session from database:', generationData.id);
        console.log('Session has files:', !!generationData.files, 'Count:', generationData.files?.length || 0);
        
        if (!generation && !existingGeneration) {
          startGenerationWithId(id, {
            prompt: generationData.prompt || '',
            targetLanguage: generationData.target_language || 'html', // Fallback to vanilla HTML
            complexity: generationData.complexity || 'moderate',
            agents: generationData.agents || ['CodeGenerator'],
          });
        }
        
        // Load files from database (legacy mode)
        if (generationData.files && Array.isArray(generationData.files) && generationData.files.length > 0) {
          console.log('📦 Loading files from database (legacy):', generationData.files.length);
          updateGenerationFiles(id, generationData.files);
          
          // Ensure panel is visible when files are loaded
          setIsPreviewPanelVisible(true);
        }
        
        // ✅ ALWAYS load chat messages from DB (even if generation exists in memory)
        const { data: chatData, error: chatError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('generation_id', id)
          .order('created_at', { ascending: true });
        
        if (!chatError && chatData) {
          const historyMessages: AgentMessage[] = chatData.map((msg) => ({
            id: msg.id || `msg_${Date.now()}_${Math.random()}`,
            agent: msg.role === 'user' ? 'User' : 'ChatAgent',
            role: msg.role === 'assistant' ? 'agent' : msg.role as 'user' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            imageUrls: msg.image_urls,
          }));
          
          // Set messages from history
          setMessages(historyMessages);
          console.log(`✅ Loaded ${historyMessages.length} chat messages from database`);
        } else if (chatError) {
          console.error('❌ Error loading chat messages:', chatError);
          setMessages([]);
        } else {
          console.log('📭 No chat messages found for this session');
          setMessages([]);
        }
        
        if (generationData.deployment_status) {
          setDeploymentData({
            url: generationData.preview_url,
            status: generationData.deployment_status,
          });
        }
        
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadSession();
  }, [id]); // Reload whenever ID changes

  // Auto-select first file when files are available
  useEffect(() => {
    if (generation?.response?.files && generation.response.files.length > 0 && !selectedFile) {
      console.log('🎯 Auto-selecting first file from generation files');
      setSelectedFile(generation.response.files[0]);
    }
  }, [generation?.response?.files]);

  // Debug: Log when generation or files change
  useEffect(() => {
    if (generation) {
      console.log('[TerminalPage] Generation state:', {
        id: generation.id,
        hasResponse: !!generation.response,
        hasFiles: !!generation.response?.files,
        filesCount: generation.response?.files?.length || 0,
        panelVisible: isPreviewPanelVisible
      });
    }
  }, [generation, isPreviewPanelVisible]);

  // DISABLED: This effect caused duplicate API calls
  // Files are now loaded ONLY in loadSession effect to prevent duplicates
  // Solution: Single source of truth = loadSession effect handles all file loading
  
  /*
  useEffect(() => {
    // This effect is disabled - files loaded in loadSession only
  }, [generation?.status, generation?.response?.files, id]);
  */

  // Auto-show preview panel when files are loaded
  useEffect(() => {
    console.log('🔍 Panel visibility check:', {
      hasGeneration: !!generation,
      hasResponse: !!generation?.response,
      hasFiles: !!generation?.response?.files,
      filesCount: generation?.response?.files?.length || 0,
      currentPanelState: isPreviewPanelVisible
    });
    
    if (generation?.response?.files && generation.response.files.length > 0) {
      console.log('📂 Files detected, showing preview panel');
      setIsPreviewPanelVisible(true);
      
      // Auto-select first file if none selected
      if (!selectedFile) {
        setSelectedFile(generation.response.files[0]);
      }
    } else if (generation && !generation?.response?.files) {
      console.warn('⚠️ Generation exists but no files in response');
    }
  }, [generation?.response?.files?.length]); // Only trigger when files count changes

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      alert(`Some files were not added:\n${errors.join('\n')}`);
    }
    
    setSelectedImages(prev => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle code editor content change
  const handleCodeChange = (newContent: string) => {
    if (selectedFile && newContent !== selectedFile.content) {
      setSelectedFile({ ...selectedFile, content: newContent });
      setHasUnsavedChanges(true);
    }
  };

  // Save file changes
  const handleSaveFile = async () => {
    if (!selectedFile || !id || !generation || !generation.response?.files) {
      showToast('error', 'No file selected or generation not found');
      return;
    }

    setIsSaving(true);
    try {
      // Update the file in the files array
      const updatedFiles = generation.response.files.map((file: any) => {
        if (file.path === selectedFile.path) {
          return { ...file, content: selectedFile.content };
        }
        return file;
      });

      // Update in store
      updateGenerationFiles(id, updatedFiles);

      // Update in database via API
      await apiClient.post(`/api/generations/${id}/update-files`, {
        files: updatedFiles
      });

      setHasUnsavedChanges(false);
      showToast('success', 'File saved successfully!');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error saving file:', error);
      showToast('error', 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewChat = () => {
    navigate('/terminal');
    setMessages([]);
    setChatInput('');
    setSelectedImages([]);
    setSelectedFile(null);
    // 🔧 FIX: Clear current generation state to prevent file leakage
    clearCurrent();
  };

  // Page refresh: Reload the entire page
  const handlePageRefresh = () => {
    console.log('🔄 Performing page refresh...');
    window.location.reload();
  };

  const handleSelectChat = (chatId: string) => {
    navigate(`/terminal/${chatId}`);
    setIsSidebarVisible(false); // Close sidebar after selecting chat on mobile
  };

  // Send message - AI will auto-route to correct agent
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;

    const userMessage = chatInput.trim();
    const imagesToUpload = [...selectedImages];
    
    setChatInput('');
    setSelectedImages([]);
    setIsProcessing(true);
    
    let sessionId = id; // Declare outside try block so it's available in catch

    try {
      let imageUrls: string[] = [];
      if (imagesToUpload.length > 0 && user) {
        setUploadingImages(true);
        const uploadResults = await uploadMultipleFiles(imagesToUpload, user.id, 'chat');
        imageUrls = uploadResults
          .filter((result) => result.url && !result.error)
          .map((result) => result.url);
        setUploadingImages(false);
      }

      const userAgentMessage: AgentMessage = {
        id: `msg_${Date.now()}_user`,
        agent: 'User',
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
      setMessages(prev => [...prev, userAgentMessage]);

      // Don't show static thinking message anymore - will be replaced by progress messages
      // const thinkingMessageId = `msg_${Date.now()}_thinking`;
      // const thinkingMessage: AgentMessage = {
      //   id: thinkingMessageId,
      //   agent: 'System',
      //   role: 'thought',
      //   content: 'Analyzing request and routing to appropriate agents...',
      //   timestamp: new Date(),
      // };
      // setMessages(prev => [...prev, thinkingMessage]);
      
      // Create new session if needed BEFORE saving user message
      const isNewSession = !sessionId;
      if (isNewSession) {
        console.log('📝 Creating new chat session ID...');
        // Generate UUID on frontend
        sessionId = crypto.randomUUID();
        console.log(`✅ Created new session: ${sessionId}`);
        
        // Navigate to the new session URL
        navigate(`/terminal/${sessionId}`, { replace: true });
      }
      
      // Don't save user message here - let backend handle it via ChatMemoryManager
      console.log('✅ User message will be saved by backend via ChatMemoryManager');

      // Debug session info
      console.log('🔍 Session debug:', {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        hasGitHubToken: !!session?.user?.user_metadata?.github_token,
        provider: session?.user?.app_metadata?.provider,
        userMetadata: session?.user?.user_metadata,
      });

      // Extract GitHub context from session if available
      let githubContext;
      
      // Try provider_token first (OAuth), then fallback to user_metadata token (PAT)
      const githubToken = session?.provider_token || session?.user?.user_metadata?.github_token;
      
      if (githubToken) {
        const username = session?.user?.user_metadata?.user_name || 
                        session?.user?.user_metadata?.preferred_username ||
                        session?.user?.user_metadata?.name ||
                        'unknown';
        const email = session?.user?.email;
        
        githubContext = {
          token: githubToken,
          username: username,
          email: email,
        };
        
        const tokenSource = session?.provider_token ? 'OAuth' : 'Personal Access Token';
        console.log(`🔗 GitHub context detected (${tokenSource}):`, { username, email, hasToken: true });
      } else {
        console.log('⚠️ No GitHub token found. Please add your GitHub Personal Access Token in Settings.');
      }

      // 🔧 FIX: Only send files if this is the SAME session (not a new chat)
      // For new chat sessions, always send empty array to prevent file leakage from previous sessions
      const files = (!isNewSession && generation?.response?.files) ? generation.response.files : [];
      
      console.log(`📦 Session context:`, {
        isNewSession,
        hasGeneration: !!generation,
        generationId: generation?.id,
        requestedSessionId: sessionId,
        filesCount: files.length
      });
      
      const chatRequest: any = {
        generationId: sessionId,
        message: userMessage,
        // Only include language if we have it from generation AND it's the same session
        ...(!isNewSession && generation?.response?.targetLanguage && { language: generation.response.targetLanguage }),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        githubContext,
        currentFiles: files, // Empty array for new sessions, existing files for current session
        backgroundMode, // Include background mode flag
      };

      console.log(`📦 Sending ${files.length} files inline with chat request`);
      console.log(`🔧 Background mode: ${backgroundMode ? 'ENABLED' : 'disabled'}`);

      const chatResponse = await apiClient.chat(chatRequest);

      if (!chatResponse.success || !chatResponse.data?.jobId) {
        throw new Error(chatResponse.error || 'Chat request failed');
      }

      const jobId = chatResponse.data.jobId;
      
      // Check if this is a background job
      if (chatResponse.data.backgroundMode) {
        console.log(`🚀 Background job ${jobId} submitted, will be tracked via Socket.IO`);
        
        // Show toast notification for background job
        showToast('info', `🔧 Background job started: ${userMessage.substring(0, 60)}...`, 5000);
        
        // Add immediate response message
        const backgroundResponseMessage: AgentMessage = {
          id: `msg_${Date.now()}_bg_response`,
          agent: 'ChatAgent',
          role: 'agent',
          content: chatResponse.data.message || 'Your request is being processed in the background. You can continue chatting!',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, backgroundResponseMessage]);
        setIsProcessing(false);
        setChatInput('');
        setBackgroundMode(false); // Reset checkbox
        
        // Job updates will come via Socket.IO to BackgroundJobsPanel
        // No need to poll
        return;
      }
      
      // Normal (non-background) job - use polling
      console.log(`🔄 Chat job ${jobId} started, will be polled via useChatJobPolling hook`);
      
      // Set current job ID to trigger the useChatJobPolling hook
      // The hook will handle all polling, progress updates, and completion
      setCurrentJobId(jobId);
      
      // Note: All result handling (messages, files, suggestions) is now done
      // in the useChatJobPolling hook's onComplete callback

    } catch (error: any) {
      console.error('Chat request error:', error);
      
      // Only show error if it's a request error (not a polling error)
      // Polling errors are handled by useChatJobPolling hook
      const errorMessage: AgentMessage = {
        id: `msg_${Date.now()}_error`,
        agent: 'System',
        role: 'system',
        content: `❌ Error: ${error.message || 'Failed to submit request. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsProcessing(false);
    } finally {
      setUploadingImages(false);
    }
  };

  const getAgentIcon = (agent: string) => {
    const icons: Record<string, string> = {
      'User': '👤',
      'LeadEngineer': '◆',
      'CodeGenerator': '▣',
      'BugHunter': '▲',
      'RefactorGuru': '▼',
      'SecuritySentinel': '◈',
      'PerformanceProfiler': '◉',
      'TestCrafter': '◎',
      'DocWeaver': '◐',
      'ChatAgent': '🤖',
      'System': '⚙',
    };
    return icons[agent] || '●';
  };

  const handleCancelMessage = () => {
    console.log('🛑 Cancelling chat request...');
    
    // Cancel the job via API
    if (currentJobId) {
      apiClient.cancelJob(currentJobId).catch(err => {
        console.error('Error cancelling job:', err);
      });
    }
    
    // Update UI state
    setIsProcessing(false);
    setCurrentJobId(null);
    setProgressMessages([]);
    
    // Add cancellation message
    const cancelMessage: AgentMessage = {
      id: `msg_${Date.now()}_cancel`,
      agent: 'System',
      role: 'system',
      content: '⏸️ Request cancelled by user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
    
    showToast('info', 'Chat request cancelled', 3000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleDownloadZip = async () => {
    if (!generation?.response?.files || !id) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      generation.response.files.forEach((file: { path: string; content: string }) => {
        zip.file(file.path, file.content);
      });
      
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const filename = `codeforge-${id.slice(0, 8)}.zip`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Download started successfully');
    } catch (error) {
      console.error('Failed to download ZIP:', error);
      alert('Failed to download ZIP file. Please try again.');
    }
  };

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      today: [] as ChatSession[],
      yesterday: [] as ChatSession[],
      lastWeek: [] as ChatSession[],
      older: [] as ChatSession[],
    };

    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp);
      const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        groups.today.push(session);
      } else if (diffDays === 1) {
        groups.yesterday.push(session);
      } else if (diffDays <= 7) {
        groups.lastWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  };

  const sessionGroups = groupSessionsByDate(filteredSessions);

  return (
    <div className="terminal-page">
      {/* Left Sidebar - Chat History */}
      <div className={`chat-history-sidebar ${isSidebarVisible ? 'visible' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon phosphor-glow">⬡</span>
            <span className="logo-text">CODEFORGE</span>
          </div>
          <button className="btn-new-chat" onClick={() => {
            playClick();
            handleNewChat();
          }}>
            <span className="icon">✚</span>
            <span className="text">NEW CHAT</span>
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-sessions-list">
          {sessionGroups.today.length > 0 && (
            <div className="session-group">
              <div className="group-label">TODAY</div>
              {sessionGroups.today.map(session => (
                <button
                  key={session.id}
                  className={`chat-session-item ${id === session.id ? 'active' : ''}`}
                  onClick={() => {
                    playClick();
                    handleSelectChat(session.id);
                  }}
                >
                  <span className="session-icon">💬</span>
                  <div className="session-content">
                    <div className="session-title">{session.title}</div>
                    <div className="session-preview">{session.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {sessionGroups.yesterday.length > 0 && (
            <div className="session-group">
              <div className="group-label">YESTERDAY</div>
              {sessionGroups.yesterday.map(session => (
                <button
                  key={session.id}
                  className={`chat-session-item ${id === session.id ? 'active' : ''}`}
                  onClick={() => {
                    playClick();
                    handleSelectChat(session.id);
                  }}
                >
                  <span className="session-icon">💬</span>
                  <div className="session-content">
                    <div className="session-title">{session.title}</div>
                    <div className="session-preview">{session.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {sessionGroups.lastWeek.length > 0 && (
            <div className="session-group">
              <div className="group-label">LAST 7 DAYS</div>
              {sessionGroups.lastWeek.map(session => (
                <button
                  key={session.id}
                  className={`chat-session-item ${id === session.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(session.id)}
                >
                  <span className="session-icon">💬</span>
                  <div className="session-content">
                    <div className="session-title">{session.title}</div>
                    <div className="session-preview">{session.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {sessionGroups.older.length > 0 && (
            <div className="session-group">
              <div className="group-label">OLDER</div>
              {sessionGroups.older.map(session => (
                <button
                  key={session.id}
                  className={`chat-session-item ${id === session.id ? 'active' : ''}`}
                  onClick={() => handleSelectChat(session.id)}
                >
                  <span className="session-icon">💬</span>
                  <div className="session-content">
                    <div className="session-title">{session.title}</div>
                    <div className="session-preview">{session.preview}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="btn-jobs" onClick={() => {
            playClick();
            setShowBackgroundJobs(!showBackgroundJobs);
          }}>
            <span className="icon">🔧</span>
            <span className="text">JOBS</span>
            {activeJobsCount > 0 && (
              <span className="badge-count">{activeJobsCount}</span>
            )}
          </button>
          <button className="btn-settings" onClick={() => {
            playClick();
            setShowSettings(!showSettings);
          }}>
            <span className="icon">⚙</span>
            <span className="text">SETTINGS</span>
          </button>
          <button 
            className="btn-logout" 
            onClick={async () => {
              playClick();
              await supabase.auth.signOut();
              navigate('/');
            }}
            title="Logout"
          >
            <span className="icon">🚪</span>
            <span className="text">LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Background Jobs Panel */}
      {showBackgroundJobs && (
        <BackgroundJobsPanel 
          onClose={() => setShowBackgroundJobs(false)} 
          onActiveJobsCountChange={setActiveJobsCount}
        />
      )}

      {/* Main Content Area */}
      <div className="terminal-main-content">
        {/* Menu toggle button for mobile */}
        <button
          className="btn-menu-toggle"
          onClick={() => {
            playClick();
            setIsSidebarVisible(!isSidebarVisible);
          }}
          title="Toggle menu"
        >
          ☰
        </button>

        {/* Mobile action bar - Settings and Logout buttons for mobile */}
        <div className="mobile-action-bar">
          {/* <button 
            className="mobile-action-btn mobile-settings-btn"
            onClick={() => {
              playClick();
              setShowSettings(!showSettings);
            }}
            title="Settings"
          >
            ⚙
          </button> */}
            <button 
            className="mobile-action-btn mobile-logout-btn"
            style={{ paddingTop: '0.5rem' }}
            onClick={async () => {
              playClick();
              await supabase.auth.signOut();
              navigate('/');
            }}
            title="Logout"
            >
            🚪
            </button>
        </div>
        {/* Chat Interface */}
        <div className="chat-interface-area">
          <div className="chat-messages-container" onScroll={handleChatScroll}>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="matrix-rain-container">
                    <canvas id="matrix-canvas" className="matrix-canvas"></canvas>
                  </div>
                  <div className="welcome-content">
                    <pre className="ascii-logo terminal-glow">
{`    ╔═══════════════════════════════════════════════════════════════════════════════╗
    ║   ██████╗ ██████╗ ██████╗ ███████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗  ║
    ║  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝  ║
    ║  ██║     ██║   ██║██║  ██║█████╗  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗    ║
    ║  ██║     ██║   ██║██║  ██║██╔══╝  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝    ║
    ║  ╚██████╗╚██████╔╝██████╔╝███████╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗  ║
    ║   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝  ║
    ║                                                                               ║
    ║                      [ A I   P O W E R E D   C O D E   G E N ]                ║
    ╚═══════════════════════════════════════════════════════════════════════════════╝`}
                    </pre>
                    <div className="welcome-features">
                      <div className="feature-line typing-effect" style={{ animationDelay: '0.5s' }}>
                        <span className="feature-icon">▸</span>
                        <span className="feature-text">GENERATE_CODE<span className="cursor-blink">_</span></span>
                      </div>
                      <div className="feature-line typing-effect" style={{ animationDelay: '1s' }}>
                        <span className="feature-icon">▸</span>
                        <span className="feature-text">ANALYZE_AND_REVIEW<span className="cursor-blink">_</span></span>
                      </div>
                      <div className="feature-line typing-effect" style={{ animationDelay: '1.5s' }}>
                        <span className="feature-icon">▸</span>
                        <span className="feature-text">REFACTOR_OPTIMIZE<span className="cursor-blink">_</span></span>
                      </div>
                      <div className="feature-line typing-effect" style={{ animationDelay: '2s' }}>
                        <span className="feature-icon">▸</span>
                        <span className="feature-text">SECURITY_SCAN<span className="cursor-blink">_</span></span>
                      </div>
                      <div className="feature-line typing-effect" style={{ animationDelay: '2.5s' }}>
                        <span className="feature-icon">▸</span>
                        <span className="feature-text">TESTS_AND_DOCS<span className="cursor-blink">_</span></span>
                      </div>
                    </div>
                    <div className="welcome-prompt typing-effect" style={{ animationDelay: '3s' }}>
                      <span className="prompt-symbol">&gt;&gt;</span>
                      <span className="prompt-text">AWAITING_INPUT<span className="cursor-blink">█</span></span>
                    </div>
                    <div className="scan-line"></div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.role} ${
                      message.role === 'user' ? 'text-success' :
                      message.role === 'system' ? 'text-warning' :
                      message.role === 'thought' ? 'text-muted' :
                      'text-primary'
                    }`}
                  >
                    <div className="message-header">
                      <span className="message-icon phosphor-glow">
                        {getAgentIcon(message.agent)}
                      </span>
                      <span className="message-agent phosphor-glow">
                        [{(message.agent || 'system').toUpperCase()}]
                      </span>
                      {message.role === 'thought' && (
                        <span className="message-role">(THINKING)</span>
                      )}
                      <span className="message-timestamp text-muted">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>

                    <div className="message-content">
                      <span className="message-prefix">&gt;&gt;</span>
                      <span className="message-text">
                        {message.content}
                        {message.role === 'thought' && (
                          <span className="typing-dots">
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                          </span>
                        )}
                      </span>
                    </div>

                    {message.imageUrls && message.imageUrls.length > 0 && (
                      <div className="message-images">
                        {message.imageUrls.map((url, idx) => (
                          <div key={idx} className="message-image-wrapper">
                            <img src={url} alt={`Attachment ${idx + 1}`} className="message-image" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Show realtime progress messages from agents */}
              {isProcessing && progressMessages.length > 0 && (
                <div className="agent-progress-container">
                  {progressMessages.map((progress, idx) => (
                    <div 
                      key={`${progress.timestamp}_${idx}`}
                      className={`agent-progress-message ${progress.status}`}
                    >
                      <div className="progress-header">
                        <span className="progress-icon phosphor-glow">
                          {getAgentIcon(progress.agent)}
                        </span>
                        <span className="progress-agent phosphor-glow">
                          [{progress.agent.toUpperCase()}]
                        </span>
                        <span className={`progress-status ${progress.status}`}>
                          {progress.status === 'started' ? '⏳' : progress.status === 'completed' ? '✓' : '✗'}
                        </span>
                        <span className="progress-timestamp text-muted">
                          {new Date(progress.timestamp).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="progress-content">
                        <span className="message-prefix">&gt;&gt;</span>
                        <span className="progress-text">
                          {progress.message}
                          {progress.status === 'started' && (
                            <span className="typing-dots">
                              <span>.</span>
                              <span>.</span>
                              <span>.</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isProcessing && progressMessages.length === 0 && (
                <div className="chat-streaming">
                  <span className="streaming-icon phosphor-glow">◉</span>
                  <span className="streaming-text">PROCESSING</span>
                  <span className="streaming-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="chat-input-section">
            {selectedImages.length > 0 && (
              <div className="selected-images-preview">
                {selectedImages.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Preview ${index + 1}`}
                      className="preview-thumbnail"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      ×
                    </button>
                    <span className="image-name">{image.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="chat-input-form">
              {/* Toolbar - Above input */}
              <div className="chat-input-toolbar">
                <div className="toolbar-left">
                  <button 
                    type="button"
                    className={`toolbar-btn ${backgroundMode ? 'active' : ''}`}
                    onClick={() => {
                      setBackgroundMode(!backgroundMode);
                      playToggle();
                    }}
                    disabled={isProcessing}
                    title="Run in background - you can continue chatting while this processes"
                  >
                    <span className="btn-icon">🔧</span>
                    <span className="btn-text">Background</span>
                    {backgroundMode && <span className="active-indicator">●</span>}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.html,.md,.pdf,.tex,.txt,.csv,.json,.xml,.xlsx,.pptx,.c,.cpp,.css,.java,.js,.php,.py,.rb,.ts,.tsx,.jsx,.go,.rs,.swift,.gif,.jpg,.jpeg,.png,.webp,.tar,.zip"
                    multiple
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button"
                    className="toolbar-btn"
                    onClick={() => {
                      playClick();
                      handleImageButtonClick();
                    }}
                    disabled={isProcessing || uploadingImages}
                    title="Attach files (images, documents, code, etc.)"
                  >
                    <span className="btn-icon">📎</span>
                    <span className="btn-text">Attach</span>
                    {selectedImages.length > 0 && (
                      <span className="badge-count">{selectedImages.length}</span>
                    )}
                  </button>
                </div>

                <div className="toolbar-right">
                  {/* VAPI Voice Call Button */}
                  <VapiCallAgent compact={true} />
                </div>
              </div>

              {/* Main Input */}
              <div className="input-wrapper">
                <span className="input-prefix">&gt;&gt;</span>
                <input
                  type="text"
                  className="input chat-input"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    // Play typing sound (throttled to avoid too many sounds)
                    const now = Date.now();
                    if (now - lastTypeTimeRef.current > 100) {
                      playType();
                      lastTypeTimeRef.current = now;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Describe what you need: generate, review, refactor, optimize..."
                  disabled={isProcessing || uploadingImages}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary btn-send"
                  disabled={isProcessing || uploadingImages || !chatInput.trim()}
                  onClick={() => playClick()}
                  title="Send message (Enter)"
                >
                  <span className="send-icon">►</span>
                </button>
                {isProcessing && (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-cancel"
                    onClick={() => {
                      playClick();
                      handleCancelMessage();
                    }}
                    title="Cancel request"
                  >
                    <span className="cancel-icon">⏸</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Toggle button for right panel when hidden */}
        {generation?.response?.files && generation.response.files.length > 0 && !isPreviewPanelVisible && (
          <button 
            className="btn-toggle-preview collapsed"
            onClick={() => setIsPreviewPanelVisible(true)}
            title="Show preview panel"
          >
            ◀
          </button>
        )}

        {/* Right Panel - Code/Preview/Deploy */}
        {generation?.response?.files && generation.response.files.length > 0 && isPreviewPanelVisible && (
          <div className="code-preview-panel">
            <div className="tabs">
              <button 
                className={activeTab === 'source' ? 'active' : ''} 
                onClick={() => {
                  playTabSwitch();
                  setActiveTab('source');
                }}
              >
                SOURCE CODE
              </button>
              <button 
                className={activeTab === 'preview' ? 'active' : ''} 
                onClick={() => {
                  playTabSwitch();
                  setActiveTab('preview');
                }}
              >
                PREVIEW
              </button>
              <button 
                className={activeTab === 'deploy' ? 'active' : ''} 
                onClick={() => {
                  playTabSwitch();
                  setActiveTab('deploy');
                }}
              >
                DEPLOY
              </button>
              <button 
                className="btn-close-panel"
                onClick={() => {
                  playClick();
                  setIsPreviewPanelVisible(false);
                }}
                title="Hide preview panel"
              >
                ✕
              </button>
            </div>

            <div className="source-code-view" style={{ display: activeTab === 'source' ? 'flex' : 'none' }}>
              <div className={`file-tree-sidebar ${isFileTreeCollapsed ? 'collapsed' : ''}`}>
                <div className="file-tree-header">
                  <span className="file-tree-title">FILES</span>
                  <button 
                    className="btn-download-zip"
                    onClick={handleDownloadZip}
                    title="Download all files as ZIP"
                  >
                    ⬇ ZIP
                  </button>
                  <button 
                    className="collapse-btn"
                    onClick={() => {
                      playToggle();
                      setIsFileTreeCollapsed(!isFileTreeCollapsed);
                    }}
                    title={isFileTreeCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isFileTreeCollapsed ? '▶' : '◀'}
                  </button>
                </div>
                <div className="file-tree-content">
                  <FileTree 
                    files={generation.response.files} 
                    onSelectFile={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </div>
              </div>
              
              <div className="code-editor-wrapper">
                {selectedFile && (
                  <div className="active-file-tab">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{selectedFile.path}</span>
                    {hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
                    <button 
                      className="save-file-button"
                      onClick={handleSaveFile}
                      disabled={!hasUnsavedChanges || isSaving}
                      title={isSaving ? 'Saving...' : 'Save changes (Ctrl+S)'}
                    >
                      {isSaving ? '💾 Saving...' : '💾 Save'}
                    </button>
                  </div>
                )}
                <div className="code-editor-container">
                  <CodeEditor
                    value={selectedFile?.content || '// Select a file from the sidebar'}
                    onChange={handleCodeChange}
                    language={selectedFile?.path.split('.').pop() || 'typescript'}
                    readOnly={false}
                    title={selectedFile?.path || 'CODEFORGE EDITOR'}
                    height="100%"
                  />
                </div>
              </div>
            </div>

            <div className="preview-view" style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
              <ProjectWorkspace
                files={generation.response.files}
                generationId={id || ''}
                language={generation.response.targetLanguage || 'typescript'}
                onPreviewReady={() => console.log('✅ Preview ready')}
                autoFixErrors={true}
                onFilesUpdated={(updatedFiles) => {
                  if (id) {
                    updateGenerationFiles(id, updatedFiles);
                    if (selectedFile) {
                      const updated = updatedFiles.find((f: any) => f.path === selectedFile.path);
                      if (updated) setSelectedFile(updated);
                    }
                  }
                }}
              />
            </div>

            {id && (
              <div className="deploy-view" style={{ display: activeTab === 'deploy' ? 'block' : 'none' }}>
                <div className="deploy-container">
                  <div className="deploy-content">
                    <h2 className="deploy-title">Deploy to Fly.io</h2>
                    <p className="deploy-description">
                      Deploy your application to production hosting on Fly.io
                    </p>
                    <div className="deploy-button-wrapper">
                      <DeployButton
                        projectId={id}
                        files={generation.response.files}
                        initialDeploymentUrl={deploymentData.url}
                        initialDeploymentStatus={deploymentData.status}
                        onDeployComplete={(url: string) => {
                          setDeploymentData({ url, status: 'deployed' });
                        }}
                        onStatusChange={(status) => {
                          // Map internal button status to deployment status
                          const statusMap: Record<string, 'pending' | 'deploying' | 'deployed' | 'failed'> = {
                            'idle': 'pending',
                            'deploying': 'deploying',
                            'success': 'deployed',
                            'error': 'failed',
                          };
                          setDeploymentData({ 
                            url: deploymentData.url, 
                            status: statusMap[status] 
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
