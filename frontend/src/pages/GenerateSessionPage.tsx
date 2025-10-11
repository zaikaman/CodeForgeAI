import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AgentChat, AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
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
  const [hasGeneratedInitialPreview, setHasGeneratedInitialPreview] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'ready' | 'error'>('idle');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let pollAttempts = 0;
    const pollDelayRef = { current: 5000 }; // Start with 5 seconds, use ref to avoid stale closure

    const fetchGenerationData = async () => {
      if (!id || !isMounted) return;
      
      pollAttempts++;
      
      try {
        console.log('🔄 Fetching generation data directly from Supabase...');
        
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
            if (!generation) {
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
        
        console.log('✅ Fetched generation data from Supabase:', data);
        
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
          if (data.status === 'completed') {
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
        
        // If generation is still processing, continue polling
        const status = data.status;
        if (status === 'pending' || status === 'processing') {
          console.log(`📊 Generation status: ${status} - will continue polling in ${pollDelayRef.current}ms (attempt ${pollAttempts})...`);
          setIsGenerating(true);
          
          // Reset poll attempts on success
          pollAttempts = 0;
          
          // Continue polling if not already polling
          if (!pollInterval && isMounted) {
            // Use exponential backoff: start at 5s, max 15s
            pollInterval = setInterval(() => {
              fetchGenerationData();
            }, pollDelayRef.current);
          }
        } else if (status === 'completed') {
          console.log('✅ Generation completed!');
          setIsGenerating(false);
          
          // Stop polling
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
          // Data from Supabase already includes everything we need
          console.log('✅ Got complete generation data:', {
            hasFiles: !!data.files,
            fileCount: data.files ? (Array.isArray(data.files) ? data.files.length : Object.keys(data.files).length) : 0,
            filesType: typeof data.files,
          });
          
          // Update store with complete data including files
          const storeState = useGenerationStore.getState();
          storeState.completeGeneration(id, data);
          
          // Also verify store was updated
          const storeGenerations = (useGenerationStore.getState() as any).generations;
          const updatedGen = storeGenerations ? storeGenerations.get(id) : null;
          console.log('📦 Store updated, generation files:', {
            hasGen: !!updatedGen,
            hasFiles: !!updatedGen?.files,
            fileCount: updatedGen?.files ? Object.keys(updatedGen.files).length : 0,
          });
        } else if (status === 'failed') {
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
        
        // For database errors, just continue polling with backoff
        // Supabase client handles auth, rate limiting, etc. automatically
        if (isMounted && pollAttempts < 60) { // Max 60 attempts (5 minutes with 5s delay)
          console.log(`🔄 Will retry fetching (attempt ${pollAttempts}/60)...`);
          // Polling will continue automatically
        } else {
          console.error('❌ Too many failed attempts - stopping polling');
          setIsGenerating(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      }
    };
    
    // Initial fetch
    fetchGenerationData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [id]); // Only run once on mount

  // Load chat history when page loads
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id || chatHistoryLoaded) return;
      
      try {
        const response = await apiClient.getChatHistory(id);
        if (response.success && response.data?.messages) {
          // Convert stored messages to AgentMessage format
          const historyMessages: AgentMessage[] = response.data.messages.map((msg) => ({
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
          console.log(`✅ Loaded ${historyMessages.length} chat messages from history`);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [id, chatHistoryLoaded, addMessageToGeneration]);

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

  // Poll deployment status until ready
  const pollDeploymentStatus = React.useCallback(async (generationId: string) => {
    try {
      const data = await apiClient.checkPreviewStatus(generationId);

      if (data.success && data.data) {
        console.log('📊 Poll result:', data.data.status, 'ready:', data.data.ready, 'previewUrl:', data.data.previewUrl);
        
        // Set preview URL if available
        if (data.data.previewUrl) {
          const newPreviewUrl = data.data.previewUrl;
          setPreviewUrl((currentUrl) => {
            if (!currentUrl) {
              console.log('✅ Found preview URL from polling:', newPreviewUrl);
              setActiveTab('preview'); // Switch to preview tab
              return withCacheBust(newPreviewUrl);
            }
            return currentUrl;
          });
        }

        if (data.data.ready) {
          setDeploymentStatus('ready');
          // Force iframe refresh with new key
          setIframeKey(Date.now());
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          console.log('✅ Deployment is ready and live');
        } else if (data.data.previewUrl) {
          // Has preview URL but not ready yet
          setDeploymentStatus('deploying');
        } else if (data.data.status === 'deploying' || data.data.status === 'pending') {
          // Still deploying or pending deployment, no URL yet
          setDeploymentStatus('deploying');
          console.log('🔄 Still deploying...');
        }
      } else if (!data.success && data.error) {
        // API returned error but responded - this might be temporary
        console.warn('⚠️ Preview status check failed:', data.error);
        
        // Only set error status if we get consistent failures
        // Check if this is a "backend not available" error
        if (data.error.includes('Backend not available') || data.error.includes('not available')) {
          // Stop polling only after backend is confirmed unavailable
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setDeploymentStatus('error');
        }
        // For other errors, keep polling - might be temporary
      }
    } catch (error: any) {
      console.error('Failed to check deployment status:', error);
      
      // Only stop polling and show error if it's a fatal error
      // Network errors or temporary issues should not stop polling
      if (error?.status === 0 || error?.message?.includes('Network error')) {
        console.warn('⚠️ Network error - will retry...');
        // Keep polling, don't set error status
      } else {
        // Fatal error - stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setDeploymentStatus('error');
      }
    }
  }, []); // Remove previewUrl dependency to avoid recreating callback

  // Start polling when deployment is in progress (not just when preview URL exists)
  useEffect(() => {
    if (deploymentStatus === 'deploying' && id) {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollDeploymentStatus(id);
      }, 3000);

      // Initial poll
      pollDeploymentStatus(id);
    }

    // Cleanup on unmount or when status changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [deploymentStatus, id, pollDeploymentStatus]);

  // Check deployment status when generation completes or when component mounts
  // Backend auto-deploys after generation, so we just need to check for existing preview
  useEffect(() => {
    const shouldCheckStatus = generation?.response?.files && 
                              generation.response.files.length > 0 &&
                              !hasGeneratedInitialPreview &&
                              generation.id;

    if (shouldCheckStatus) {
      // Mark as checked to avoid repeated calls
      setHasGeneratedInitialPreview(true);
      
      console.log('🔍 Checking for existing preview deployment...');
      
      // Check if preview already exists from backend auto-deploy
      pollDeploymentStatus(generation.id);
    }
  }, [generation?.response?.files, hasGeneratedInitialPreview, generation?.id, pollDeploymentStatus]);

  // On component mount, if we don't have a preview URL in state but generation exists
  // Check the database for existing preview_url (in case of page refresh)
  useEffect(() => {
    const checkExistingPreview = async () => {
      if (!id || previewUrl || hasGeneratedInitialPreview) return;
      
      if (generation?.response?.files && generation.response.files.length > 0) {
        console.log('🔄 Page loaded - checking database for existing preview...');
        
        // Poll once to check database
        await pollDeploymentStatus(id);
        setHasGeneratedInitialPreview(true);
      }
    };

    // Small delay to let other useEffects run first
    const timer = setTimeout(checkExistingPreview, 500);
    return () => clearTimeout(timer);
  }, [id, generation?.response?.files, previewUrl, hasGeneratedInitialPreview, pollDeploymentStatus]);

  // Auto-trigger deployment when switching to preview tab if status is pending
  useEffect(() => {
    const checkAndDeploy = async () => {
      if (activeTab !== 'preview' || !id || isGeneratingPreview) return;
      
      // Check current deployment status from database
      const { data: generationData } = await supabase
        .from('generations')
        .select('deployment_status, files')
        .eq('id', id)
        .single();
      
      if (generationData?.deployment_status === 'pending' && generationData?.files) {
        console.log('🔄 Code changed detected (status: pending), triggering deployment...');
        handlePreview(true); // Force regenerate since code changed
      }
    };
    
    checkAndDeploy();
  }, [activeTab, id, isGeneratingPreview]); // Only run when switching to preview tab

  const handlePreview = async (forceRegenerate: boolean = false) => {
    if (generation && generation.response?.files && !isGeneratingPreview) {
      // If preview already exists and not forcing regenerate, just check status
      if (previewUrl && !forceRegenerate) {
        console.log('Preview already exists, checking deployment status...');
        pollDeploymentStatus(generation.id);
        return;
      }

      setIsGeneratingPreview(true);
      setDeploymentStatus('deploying');
      
      try {
        const response = await apiClient.generatePreview({ 
          generationId: generation.id,
          files: generation.response.files,
          forceRegenerate: forceRegenerate
        });

        const data = response;

        // Check if we got a 202 Accepted response (deployment started)
        if (data.success && data.data) {
          if (data.data.status === 'deploying') {
            console.log('✅ Deployment started, polling for status...');
            if (!hasGeneratedInitialPreview) {
              setHasGeneratedInitialPreview(true);
              setActiveTab('preview');
            }
            // Polling will happen automatically via useEffect
            setDeploymentStatus('deploying');
          } else if (data.data.previewUrl) {
            // Got preview URL immediately (cached or already deployed)
            setPreviewUrl(withCacheBust(data.data.previewUrl));
            if (!hasGeneratedInitialPreview) {
              setHasGeneratedInitialPreview(true);
              setActiveTab('preview');
            }
            
            // Log if using cached preview
            if (data.data.cached) {
              console.log('✅ Using cached preview URL');
              setDeploymentStatus('ready');
              setIframeKey(Date.now());
            } else {
              console.log('✅ Deployment complete, preview ready');
              setDeploymentStatus('ready');
              setIframeKey(Date.now());
            }
          }
        } else {
          console.error('Unexpected response:', data);
          setDeploymentStatus('error');
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
        setDeploymentStatus('error');
      } finally {
        setIsGeneratingPreview(false);
      }
    }
  };

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

      // Generate preview with new files FIRST (force regenerate since code changed)
      setIsGeneratingPreview(true);
      setDeploymentStatus('deploying');
      
      try {
        const previewResponse = await apiClient.generatePreview({
          generationId: id,
          files: data.files,
          forceRegenerate: true // Force regenerate because code changed
        });

        if (previewResponse.success && previewResponse.data) {
          if (previewResponse.data.status === 'deploying') {
            console.log('✅ Deployment started, polling for status...');
            if (!hasGeneratedInitialPreview) {
              setHasGeneratedInitialPreview(true);
            }
            // Polling will happen automatically via useEffect
            setDeploymentStatus('deploying');
          } else if (previewResponse.data.previewUrl) {
            setPreviewUrl(withCacheBust(previewResponse.data.previewUrl));
            if (!hasGeneratedInitialPreview) {
              setHasGeneratedInitialPreview(true);
            }
            
            if (previewResponse.data.cached) {
              console.log('✅ Using cached preview URL');
              setDeploymentStatus('ready');
              setIframeKey(Date.now());
            } else {
              console.log('✅ Deployment complete, preview ready');
              setDeploymentStatus('deploying'); // Will poll to verify it's actually ready
            }
          }
        }
      } catch (previewError) {
        console.error('Failed to generate preview:', previewError);
        setDeploymentStatus('error');
      } finally {
        setIsGeneratingPreview(false);
      }

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
              <div className="preview-actions">
                <button 
                  onClick={() => handlePreview(true)} 
                  disabled={!generation || isGenerating || isGeneratingPreview || deploymentStatus === 'deploying'}
                  className="btn btn-primary"
                >
                  {isGeneratingPreview ? 'GENERATING...' : 'REGENERATE PREVIEW'}
                </button>
                {previewUrl && deploymentStatus === 'ready' && (
                  <button 
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="btn btn-secondary"
                    disabled={isGeneratingPreview}
                  >
                    VIEW PAGE ↗
                  </button>
                )}
                {deploymentStatus === 'deploying' && (
                  <span className="deployment-status deploying">
                    🔄 Deploying... (auto-refreshing)
                  </span>
                )}
                {deploymentStatus === 'ready' && (
                  <span className="deployment-status ready">
                    ✅ Live
                  </span>
                )}
                {deploymentStatus === 'error' && (
                  <span className="deployment-status error" title="Backend API not available">
                    ⚠️ Preview Unavailable
                  </span>
                )}
              </div>
              {deploymentStatus === 'deploying' ? (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      DEPLOYMENT IN PROGRESS       ║
    ║                                   ║
    ║   ►  Building your application... ║
    ║   ►  Waiting for servers...       ║
    ║   ►  This may take 30-60 seconds  ║
    ║                                   ║
    ║      Preview will load            ║
    ║      automatically when ready     ║
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
              ) : previewUrl ? (
                <iframe 
                  key={iframeKey} 
                  src={previewUrl} 
                  title="Preview"
                  width="100%"
                  height="100%"
                  style={{ 
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    background: '#000'
                  }}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  onLoad={() => {
                    console.log('✅ Iframe loaded successfully:', previewUrl);
                  }}
                  onError={(e) => {
                    console.error('❌ Iframe failed to load:', previewUrl, e);
                  }}
                />
              ) : (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      WAITING FOR PREVIEW...       ║
    ║                                   ║
    ║   ►  Preview will load            ║
    ║      automatically                ║
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
