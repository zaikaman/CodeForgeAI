import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
import { ProjectWorkspace } from '../components/ProjectWorkspace';
import { DeployButton } from '../components/DeployButton';
import { SettingsModal } from '../components/SettingsModal';
import { useGenerationStore } from '../stores/generationStore';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useChatJobPolling } from '../hooks/useChatJobPolling';
import { useSoundEffects } from '../hooks/useSoundEffects';
import apiClient from '../services/apiClient';
import { uploadMultipleImages, validateImageFile } from '../services/imageUploadService';
import '../styles/theme.css';
import './TerminalPage.css';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

export const TerminalPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuthContext();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sidebar State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // UI State
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'preview' | 'deploy'>('source');
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPreviewPanelVisible, setIsPreviewPanelVisible] = useState(true);
  
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

  // Use custom hook to poll chat job directly from Supabase
  // This avoids backend timeout limits
  useChatJobPolling({
    jobId: currentJobId,
    enabled: isProcessing && !!currentJobId,
    pollInterval: 500, // Poll every 500ms for smooth progress updates
    maxAttempts: 1000, // 2 minutes max (500ms * 240 = 120s)
    onProgressUpdate: (messages) => {
      setProgressMessages(messages);
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

    const loadSession = async () => {
      try {
        console.log(`📂 Loading session ${id}...`);
        
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
        
        if (!generation) {
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
      const validation = validateImageFile(file);
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
        const uploadResults = await uploadMultipleImages(imagesToUpload, user.id, 'chat');
        imageUrls = uploadResults
          .filter(result => result.url && !result.error)
          .map(result => result.url);
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
      };

      console.log(`📦 Sending ${files.length} files inline with chat request`);

      const chatResponse = await apiClient.chat(chatRequest);

      if (!chatResponse.success || !chatResponse.data?.jobId) {
        throw new Error(chatResponse.error || 'Chat request failed');
      }

      const jobId = chatResponse.data.jobId;
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
      <div className="chat-history-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
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

      {/* Main Content Area */}
      <div className="terminal-main-content">
        {/* Chat Interface */}
        <div className="chat-interface-area">
          <div className="chat-messages-container" onScroll={handleChatScroll}>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      WELCOME TO CODEFORGE AI      ║
    ║                                   ║
    ║   ►  Generate code from prompts   ║
    ║   ►  Review & analyze code        ║
    ║   ►  Refactor & optimize          ║
    ║   ►  Security & performance       ║
    ║   ►  Generate tests & docs        ║
    ║                                   ║
    ║   Just describe what you need!    ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
                  </pre>
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
                        [{message.agent.toUpperCase()}]
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button"
                  className="btn btn-secondary btn-image"
                  onClick={() => {
                    playClick();
                    handleImageButtonClick();
                  }}
                  disabled={isProcessing || uploadingImages}
                  title="Attach images"
                >
                  📎
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-send"
                  disabled={isProcessing || uploadingImages || !chatInput.trim()}
                  onClick={() => playClick()}
                >
                  ►
                </button>
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
              {activeTab === 'source' && (
                <button 
                  className="btn-download-zip"
                  onClick={handleDownloadZip}
                  title="Download all files as ZIP"
                >
                  ⬇ ZIP
                </button>
              )}
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
                  </div>
                )}
                <div className="code-editor-container">
                  <CodeEditor
                    value={selectedFile?.content || '// Select a file from the sidebar'}
                    onChange={() => {}}
                    language={selectedFile?.path.split('.').pop() || 'typescript'}
                    readOnly={true}
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
