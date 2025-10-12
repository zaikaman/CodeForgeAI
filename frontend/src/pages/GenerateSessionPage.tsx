import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AgentChat, AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
import { ProjectWorkspace } from '../components/ProjectWorkspace';
import { DeployButton } from '../components/DeployButton';
import { useGenerationStore } from '../stores/generationStore';
import apiClient from '../services/apiClient';
import { uploadMultipleImages, validateImageFile } from '../services/imageUploadService';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/theme.css';
import './GenerateSessionPage.css';

const BUILD_ID = (import.meta as any).env.VITE_BUILD_ID 
  || (import.meta as any).env.VERCEL_GIT_COMMIT_SHA 
  || (import.meta as any).env.GITHUB_SHA 
  || (import.meta as any).env.COMMIT_REF 
  || Date.now().toString();

const withCacheBust = (urlStr: string): string => {
  try {
    const u = new URL(urlStr);
    u.searchParams.set('v', BUILD_ID);
    return u.toString();
  } catch {
    const sep = urlStr.includes('?') ? '&' : '?';
    return `${urlStr}${sep}v=${BUILD_ID}`;
  }
};

export const GenerateSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('source');
  const [chatInput, setChatInput] = useState('');
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  // DISABLED: Preview deployment states kept for compatibility but not actively used
  // WebContainer handles instant preview now, deployment is manual via Deploy button
  const [_hasGeneratedInitialPreview, _setHasGeneratedInitialPreview] = useState(false);
  const [_isGeneratingPreview, _setIsGeneratingPreview] = useState(false);
  const [_deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'ready' | 'error'>('idle');
  const [_iframeKey, _setIframeKey] = useState<number>(Date.now());
  
  // Store deployment data from database
  const [deploymentData, setDeploymentData] = useState<{
    url: string | null;
    status: 'pending' | 'deploying' | 'deployed' | 'failed' | null;
  }>({ url: null, status: null });
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // DISABLED: pollingIntervalRef not needed with WebContainer
  // const _pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const store = useGenerationStore();
  const { 
    currentGeneration, 
    isGenerating, 
    getGenerationById, 
    updateGenerationFiles, 
    addMessageToGeneration,
    setIsGenerating,
    clearCurrent,
    history
  } = store;

  // Get the current generation from store
  const generation = React.useMemo(() => {
    if (!id) return null;
    return currentGeneration?.id === id ? currentGeneration : getGenerationById(id);
  }, [id, currentGeneration, history, getGenerationById]);

  // Fetch generation data directly from Supabase database
  // Poll for updates if generation is still processing
  useEffect(() => {
    if (!id) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let pollAttempts = 0;
    const POLL_INTERVAL = 3000; // Poll every 3 seconds
    const MAX_ATTEMPTS = 120; // Max 6 minutes (120 * 3s = 360s)

    const fetchGenerationData = async () => {
      if (!id || !isMounted) return;
      
      pollAttempts++;
      
      try {
        console.log(`🔄 Fetching generation data from Supabase (attempt ${pollAttempts})...`);
        
        // Query Supabase directly instead of going through backend API
        const { data: generationData, error: dbError } = await supabase
          .from('generations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (dbError || !generationData) {
          console.error('❌ Failed to fetch generation from database:', dbError);
          
          // Check for specific errors
          if (dbError?.code === 'PGRST116') {
            // Row not found
            console.error('❌ Generation not found in database');
            if (!generation && pollAttempts > 5) {
              setTimeout(() => navigate('/generate'), 2000);
            }
          }
          return;
        }
        
        console.log('✅ Fetched generation from database:', {
          id: generationData.id,
          status: generationData.status,
          hasFiles: !!generationData.files,
          fileCount: generationData.files ? (Array.isArray(generationData.files) ? generationData.files.length : Object.keys(generationData.files).length) : 0,
        });
        
        // Convert snake_case to camelCase for frontend
        const response = {
          success: true,
          data: {
            id: generationData.id,
            status: generationData.status,
            prompt: generationData.prompt,
            targetLanguage: generationData.target_language,
            complexity: generationData.complexity,
            files: generationData.files,
            agentThoughts: generationData.agent_thoughts,
            error: generationData.error,
            previewUrl: generationData.preview_url,
            deploymentStatus: generationData.deployment_status,
            createdAt: generationData.created_at,
            updatedAt: generationData.updated_at,
          }
        };
        
        const data = response.data;
        const status = data.status;
        
        console.log(`📊 Generation status: ${status}`);
        
        // If generation doesn't exist in store yet, create it
        if (!generation) {
          console.log('📝 Creating store entry for generation', id);
          const storeState = useGenerationStore.getState();
          storeState.startGenerationWithId(id, {
            prompt: data.prompt || '',
            targetLanguage: data.targetLanguage || 'typescript',
            complexity: data.complexity || 'moderate',
            agents: ['CodeGenerator'],
          });
          
          // If generation is complete, update the store with data
          if (status === 'completed') {
            storeState.completeGeneration(id, data);
          }
        }
        
        // Set deployment status based on database data
        const dbDeploymentStatus = data.deploymentStatus;
        if (dbDeploymentStatus === 'deployed') {
          setDeploymentStatus('ready');
        } else if (dbDeploymentStatus === 'deploying') {
          setDeploymentStatus('deploying');
          console.log('🚀 Deployment is in progress, will continue polling...');
        } else if (dbDeploymentStatus === 'failed') {
          setDeploymentStatus('error');
        }
        
        // Store deployment data for DeployButton
        setDeploymentData({
          url: data.previewUrl || null,
          status: dbDeploymentStatus || null,
        });
        
        // If we got a preview URL from database, set it
        if (data.previewUrl && !previewUrl) {
          const url = withCacheBust(data.previewUrl);
          console.log('✅ Found preview URL from database:', data.previewUrl);
          console.log('📍 Setting iframe src:', url);
          setPreviewUrl(url);
        }
        
        // Update store with latest data if needed
        if (data.files) {
          updateGenerationFiles(id, data.files);
        }
        
        // Reset poll attempts on successful fetch
        pollAttempts = 0;
        
        // Check if we should continue polling
        if (status === 'pending' || status === 'processing') {
          console.log(`� Generation is ${status}, continuing to poll...`);
          setIsGenerating(true);
          // Polling interval will handle the next fetch
        } else if (status === 'completed') {
          console.log('✅ Generation completed!');
          setIsGenerating(false);
          
          // Stop polling
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
          // Update store with complete data including files
          const storeState = useGenerationStore.getState();
          storeState.completeGeneration(id, data);
          
          console.log('✅ Got complete generation data:', {
            hasFiles: !!data.files,
            fileCount: data.files ? (Array.isArray(data.files) ? data.files.length : Object.keys(data.files).length) : 0,
          });
        } else if (status === 'failed' || status === 'error') {
          console.error('❌ Generation failed:', data.error);
          setIsGenerating(false);
          
          // Stop polling
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch from database:', error?.message || error);
        
        // Continue polling unless we hit max attempts
        if (pollAttempts >= MAX_ATTEMPTS) {
          console.error('❌ Too many failed attempts - stopping polling');
          setIsGenerating(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      }
    };
    
    // Initial fetch immediately
    fetchGenerationData();
    
    // Start polling interval
    pollInterval = setInterval(() => {
      fetchGenerationData();
    }, POLL_INTERVAL);
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [id]); // Only depend on id

  // Load chat history when page loads
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id || chatHistoryLoaded) return;
      
      // Don't reload if generation already has messages
      if (generation?.agentMessages && generation.agentMessages.length > 0) {
        console.log('⏭️ Skipping chat history load - messages already exist');
        setChatHistoryLoaded(true);
        return;
      }
      
      try {
        const response = await apiClient.getChatHistory(id);
        if (response.success && response.data?.messages) {
          // Filter out invalid messages before converting
          const validDbMessages = response.data.messages.filter(msg => 
            msg.content && msg.content.trim() !== '' && msg.createdAt
          );
          
          // Convert stored messages to AgentMessage format
          const historyMessages: AgentMessage[] = validDbMessages.map((msg) => ({
            id: msg.id,
            agent: msg.role === 'user' ? 'User' : 'ChatAgent',
            role: msg.role === 'assistant' ? 'agent' : msg.role as 'user' | 'system',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            imageUrls: msg.imageUrls,
          }));

          // Add history messages to the generation
          historyMessages.forEach((msg) => {
            addMessageToGeneration(id, msg);
          });

          setChatHistoryLoaded(true);
          console.log(`✅ Loaded ${historyMessages.length} valid chat messages from history (filtered ${response.data.messages.length - validDbMessages.length} invalid)`);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [id, chatHistoryLoaded, generation?.agentMessages, addMessageToGeneration]);

  // Auto-select first file when generation completes
  useEffect(() => {
    if (generation?.response?.files && generation.response.files.length > 0) {
      setSelectedFile(generation.response.files[0]);
    }
  }, [generation]);

  const handleSelectFile = (file: { path: string; content: string }) => {
    setSelectedFile(file);
  };

  const handleDownloadZip = async () => {
    if (!generation || !id) return;

    try {
      console.log('📦 Creating ZIP from generation files...');
      
      // Get files from generation (either from store or fetch from database)
      let files = generation.response?.files;
      
      if (!files || files.length === 0) {
        console.log('No files in store, fetching from database...');
        const { data: generationData, error: dbError } = await supabase
          .from('generations')
          .select('files')
          .eq('id', id)
          .single();
        
        if (dbError || !generationData?.files) {
          throw new Error('No files found to download');
        }
        
        files = generationData.files;
      }
      
      // Final check
      if (!files || files.length === 0) {
        throw new Error('No files available to download');
      }
      
      console.log(`Found ${files.length} files to zip`);
      
      // Dynamically import JSZip (code splitting)
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Add each file to the zip
      files.forEach((file: { path: string; content: string }) => {
        zip.file(file.path, file.content);
      });
      
      console.log('Generating ZIP blob...');
      
      // Generate the zip file
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Create filename
      const filename = `codeforge-${id.slice(0, 8)}.zip`;
      
      console.log(`✅ ZIP created (${(blob.size / 1024).toFixed(2)} KB), downloading...`);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Download started successfully');
    } catch (error) {
      console.error('Failed to download ZIP:', error);
      alert('Failed to download ZIP file. Please try again.');
    }
  };

  // DISABLED: pollDeploymentStatus function removed - not needed with WebContainer
  // Deployment status polling is no longer used since preview is instant via WebContainer
  // Manual deployment via Deploy button handles its own status checking
  // const _pollDeploymentStatus = React.useCallback(async (generationId: string) => {
  //   ... (old fly.io polling logic removed)
  // }, []);

  // DISABLED: Deployment polling removed - using WebContainer for instant preview
  // Deploy status will be checked only when user clicks Deploy button manually
  // useEffect(() => {
  //   if (deploymentStatus === 'deploying' && id) {
  //     // Poll every 3 seconds
  //     pollingIntervalRef.current = setInterval(() => {
  //       pollDeploymentStatus(id);
  //     }, 3000);
  //     pollDeploymentStatus(id);
  //   }
  //   return () => {
  //     if (pollingIntervalRef.current) {
  //       clearInterval(pollingIntervalRef.current);
  //       pollingIntervalRef.current = null;
  //     }
  //   };
  // }, [deploymentStatus, id, pollDeploymentStatus]);

  // DISABLED: Auto-check deployment removed - using WebContainer for instant preview
  // Deployment status will only be checked when user manually clicks Deploy button
  // useEffect(() => {
  //   const shouldCheckStatus = generation?.response?.files && 
  //                             generation.response.files.length > 0 &&
  //                             !hasGeneratedInitialPreview &&
  //                             generation.id;
  //   if (shouldCheckStatus) {
  //     setHasGeneratedInitialPreview(true);
  //     console.log('🔍 Checking for existing preview deployment...');
  //     pollDeploymentStatus(generation.id);
  //   }
  // }, [generation?.response?.files, hasGeneratedInitialPreview, generation?.id, pollDeploymentStatus]);

  // DISABLED: Check existing preview removed - using WebContainer for instant preview
  // Preview is now shown instantly in browser via WebContainer, no need to check fly.io deployment
  // useEffect(() => {
  //   const checkExistingPreview = async () => {
  //     if (!id || previewUrl || hasGeneratedInitialPreview) return;
  //     if (generation?.response?.files && generation.response.files.length > 0) {
  //       console.log('🔄 Page loaded - checking database for existing preview...');
  //       await pollDeploymentStatus(id);
  //       setHasGeneratedInitialPreview(true);
  //     }
  //   };
  //   const timer = setTimeout(checkExistingPreview, 500);
  //   return () => clearTimeout(timer);
  // }, [id, generation?.response?.files, previewUrl, hasGeneratedInitialPreview, pollDeploymentStatus]);

  // DISABLED: Auto-deployment removed - using WebContainer for instant preview instead
  // Deploy is now manual via Deploy button
  // useEffect(() => {
  //   const checkAndDeploy = async () => {
  //     if (activeTab !== 'preview' || !id || isGeneratingPreview) return;
  //     
  //     // Check current deployment status from database
  //     const { data: generationData } = await supabase
  //       .from('generations')
  //       .select('deployment_status, files')
  //       .eq('id', id)
  //       .single();
  //     
  //     if (generationData?.deployment_status === 'pending' && generationData?.files) {
  //       console.log('🔄 Code changed detected (status: pending), triggering deployment...');
  //       handlePreview(true); // Force regenerate since code changed
  //     }
  //   };
  //   
  //   checkAndDeploy();
  // }, [activeTab, id, isGeneratingPreview]); // Only run when switching to preview tab

  // DISABLED: handlePreview function removed - using WebContainer for instant preview
  // Deploy is now manual via Deploy button in ProjectWorkspace component
  // const handlePreview = async (forceRegenerate: boolean = false) => {
  //   ... (old fly.io deployment logic removed)
  // };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
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
    
    // Reset file input
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !generation || !id) return;

    const userMessage = chatInput.trim();
    const imagesToUpload = [...selectedImages];
    
    // Clear input and images immediately
    setChatInput('');
    setSelectedImages([]);

    // Upload images if any
    let imageUrls: string[] = [];
    if (imagesToUpload.length > 0 && user) {
      setUploadingImages(true);
      try {
        const uploadResults = await uploadMultipleImages(imagesToUpload, user.id, 'chat');
        imageUrls = uploadResults
          .filter(result => result.url && !result.error)
          .map(result => result.url);
        
        if (uploadResults.some(result => result.error)) {
          console.error('Some images failed to upload:', uploadResults.filter(r => r.error));
        }
      } catch (error) {
        console.error('Failed to upload images:', error);
      } finally {
        setUploadingImages(false);
      }
    }

    // Add user message to chat immediately with images
    const userAgentMessage: AgentMessage = {
      id: `msg_${Date.now()}_user`,
      agent: 'User',
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
    addMessageToGeneration(id, userAgentMessage);

    // Add temporary "thinking" message
    const thinkingMessageId = `msg_${Date.now()}_thinking`;
    const thinkingMessage: AgentMessage = {
      id: thinkingMessageId,
      agent: 'System',
      role: 'thought',
      content: 'Analyzing request and generating code...',
      timestamp: new Date(),
    };
    addMessageToGeneration(id, thinkingMessage);

    // Set generating state
    setIsGenerating(true);

    try {
      // Call chat API to start the job
      const apiRes = await apiClient.chat({
        generationId: id,
        message: userMessage,
        currentFiles: generation.response?.files || [],
        language: generation.response?.language || 'typescript',
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      if (!apiRes.success || !apiRes.data || !apiRes.data.jobId) {
        throw new Error(apiRes.error || 'Chat request failed');
      }

      const jobId = apiRes.data.jobId;
      console.log(`🔄 Chat job ${jobId} started, polling from database...`);

      // Poll for results directly from Supabase
      const pollInterval = 1000; // Poll every 1 second
      const maxAttempts = 120; // Max 2 minutes
      let attempts = 0;
      let data: any = null;

      while (attempts < maxAttempts) {
        attempts++;
        
        // Query Supabase directly instead of backend API
        const { data: chatJobData, error: dbError } = await supabase
          .from('chat_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (dbError || !chatJobData) {
          console.error('Failed to fetch chat job from database:', dbError);
          throw new Error('Failed to check chat status');
        }

        const status = chatJobData.status;
        console.log(`📊 Chat job ${jobId} status: ${status} (attempt ${attempts}/${maxAttempts})`);

        if (status === 'completed') {
          data = {
            status: chatJobData.status,
            files: chatJobData.result?.files,
            agentThought: {
              agent: 'ChatAgent',
              thought: chatJobData.result?.summary || 'Changes applied successfully',
            },
          };
          console.log('✅ Chat job completed!');
          break;
        } else if (status === 'error') {
          throw new Error(chatJobData.error || 'Chat job failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      if (!data) {
        throw new Error('Chat request timed out. Please try again.');
      }

      // DISABLED: Auto-deployment removed - using WebContainer for instant preview
      // Files will be shown in WebContainer preview automatically
      // Deploy is now manual via Deploy button
      console.log('✅ Chat changes applied, files updated. WebContainer will show preview automatically.');

      // Remove thinking message and add agent response AFTER preview is loaded
      const updatedMessages = generation.agentMessages?.filter(
        (msg) => msg.id !== thinkingMessageId
      ) || [];
      
      const agentResponseMessage: AgentMessage = {
        id: `msg_${Date.now()}_agent`,
        agent: data.agentThought.agent,
        role: 'agent',
        content: data.agentThought.thought,
        timestamp: new Date(),
      };
      
      // Replace messages with updated list
      if (generation.agentMessages) {
        generation.agentMessages = [...updatedMessages, agentResponseMessage];
      }
      addMessageToGeneration(id, agentResponseMessage);

      // Update files in the generation AFTER preview is ready
      updateGenerationFiles(id, data.files);

      // If the currently selected file was updated, refresh it
      if (selectedFile) {
        const updatedFile = data.files.find(
          (f: any) => f.path === selectedFile.path
        );
        if (updatedFile) {
          setSelectedFile(updatedFile);
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add error message to chat
      const errorMessage: AgentMessage = {
        id: `msg_${Date.now()}_error`,
        agent: 'System',
        role: 'system',
        content: `Error: ${error.message || 'Failed to process your request. Please try again.'}`,
        timestamp: new Date(),
      };
      addMessageToGeneration(id, errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!generation) {
    return null;
  }

  return (
    <Layout className="generate-session-layout">
      <div className="generate-session-page">
        {/* Loading Overlay when generation is processing */}
        {isGenerating && !generation?.response?.files && (
          <div className="generation-loading-overlay">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-button close"></div>
                <div className="terminal-button minimize"></div>
                <div className="terminal-button maximize"></div>
                <div className="terminal-title">GENERATION IN PROGRESS</div>
              </div>
              <div className="terminal-content">
                <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║     AI AGENTS ARE WORKING...      ║
    ║                                   ║
    ║   ►  Analyzing your prompt...     ║
    ║   ►  Planning architecture...     ║
    ║   ►  Generating code...           ║
    ║                                   ║
    ║   This may take 1-3 minutes       ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
                </pre>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <div className="deployment-spinner">
                    <div className="spinner-dot"></div>
                    <div className="spinner-dot"></div>
                    <div className="spinner-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Left Panel - Chat (1/4 width) */}
        <div className="chat-panel">
          <AgentChat 
            messages={generation?.agentMessages || []} 
            isStreaming={isGenerating && currentGeneration?.id === id} 
            agentStatus={(isGenerating && currentGeneration?.id === id) ? 'PROCESSING' : 'STANDBY'} 
          />
          
          {/* Chat Input */}
          <div className="chat-input-container terminal-window">
            <div className="terminal-content">
              {/* Image Previews */}
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
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI to make changes to the codebase..."
                    disabled={isGenerating}
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
                    onClick={handleImageButtonClick}
                    disabled={isGenerating || uploadingImages}
                    title="Attach images"
                  >
                    📎
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-send"
                    disabled={isGenerating || !chatInput.trim()}
                  >
                    ►
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Panel - Code View (3/4 width) */}
        <div className="code-panel">
          <div className="tabs">
            <button 
              className={activeTab === 'source' ? 'active' : ''} 
              onClick={() => setActiveTab('source')}
            >
              SOURCE CODE
            </button>
            <button 
              className={activeTab === 'preview' ? 'active' : ''} 
              onClick={() => setActiveTab('preview')}
            >
              PREVIEW
            </button>
            <button 
              className={activeTab === 'deploy' ? 'active' : ''} 
              onClick={() => setActiveTab('deploy')}
            >
              DEPLOY
            </button>
            {activeTab === 'source' && generation?.response?.files && (
              <button 
                className="btn-download-zip"
                onClick={handleDownloadZip}
                title="Download all files as ZIP"
              >
                ⬇ ZIP
              </button>
            )}
            <button 
              className="btn-back"
              onClick={() => {
                clearCurrent();
                navigate('/generate');
              }}
            >
              ◄ NEW GENERATION
            </button>
          </div>

          {activeTab === 'source' && (
            <div className="source-code-view">
              {/* Collapsible File Tree Sidebar */}
              <div className={`file-tree-sidebar ${isFileTreeCollapsed ? 'collapsed' : ''}`}>
                <div className="file-tree-header">
                  <span className="file-tree-title">FILES</span>
                  <button 
                    className="collapse-btn"
                    onClick={() => setIsFileTreeCollapsed(!isFileTreeCollapsed)}
                    title={isFileTreeCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isFileTreeCollapsed ? '▶' : '◀'}
                  </button>
                </div>
                <div className="file-tree-content">
                  <FileTree 
                    files={generation?.response?.files || []} 
                    onSelectFile={handleSelectFile}
                    selectedFile={selectedFile}
                  />
                </div>
              </div>
              
              {/* Code Editor with File Tab */}
              <div className="code-editor-wrapper">
                {selectedFile && (
                  <div className="active-file-tab">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{selectedFile.path}</span>
                  </div>
                )}
                <div className="code-editor-container">
                  <CodeEditor
                    value={selectedFile?.content || '// Select a file from the sidebar to view its content'}
                    onChange={() => {}}
                    language={selectedFile?.path.split('.').pop() || 'typescript'}
                    readOnly={true}
                    title={selectedFile?.path || 'CODEFORGE EDITOR V1.0.0'}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="preview-view">
              {/* WebContainer instant preview */}
              {generation?.response?.files && generation.response.files.length > 0 ? (
                <ProjectWorkspace
                  files={generation.response.files}
                  onPreviewReady={() => console.log('✅ WebContainer preview ready')}
                />
              ) : (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      WAITING FOR GENERATION...    ║
    ║                                   ║
    ║   ►  Preview will appear          ║
    ║      when code is ready           ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="deploy-view">
              {generation?.response?.files && generation.response.files.length > 0 && id ? (
                <div className="deploy-container">
                  <div className="deploy-content">
                    <h2 className="deploy-title">Deploy to Fly.io</h2>
                    <p className="deploy-description">
                      Deploy your application to production hosting on Fly.io with a single click.
                    </p>
                    <div className="deploy-button-wrapper">
                      <DeployButton
                        projectId={id}
                        files={generation.response.files}
                        initialDeploymentUrl={deploymentData.url}
                        initialDeploymentStatus={deploymentData.status}
                        onDeployComplete={(url: string) => {
                          console.log('✅ Deployed to:', url);
                          // Update deployment data state
                          setDeploymentData({ url, status: 'deployed' });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      WAITING FOR GENERATION...    ║
    ║                                   ║
    ║   ►  Deploy will be available     ║
    ║      when code is ready           ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
