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

  // Redirect if generation not found
  useEffect(() => {
    if (id && !generation) {
      navigate('/generate');
    }
  }, [id, generation, navigate]);

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
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId: id,
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get the blob from response with correct MIME type
      const blob = await response.blob();
      const zipBlob = new Blob([blob], { type: 'application/zip' });
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `codeforge-${id.slice(0, 8)}.zip`;
      
      if (contentDisposition) {
        // Try different patterns to extract filename
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Ensure filename ends with .zip
      if (!filename.endsWith('.zip')) {
        filename = filename.replace(/\.[^.]*$/, '') + '.zip';
      }

      // Create download link
      const url = URL.createObjectURL(zipBlob);
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
    } catch (error) {
      console.error('Failed to download ZIP:', error);
      alert('Failed to download ZIP file. Please try again.');
    }
  };

  // Poll deployment status until ready
  const pollDeploymentStatus = React.useCallback(async (generationId: string) => {
    try {
      const response = await fetch(`/api/preview/status/${generationId}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Set preview URL if available
        if (data.data.previewUrl && !previewUrl) {
          setPreviewUrl(withCacheBust(data.data.previewUrl));
          setActiveTab('preview'); // Switch to preview tab
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
          setDeploymentStatus('deploying');
        }
      }
    } catch (error) {
      console.error('Failed to check deployment status:', error);
    }
  }, [previewUrl]);

  // Start polling when preview URL is set
  useEffect(() => {
    if (previewUrl && deploymentStatus === 'deploying') {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        if (id) {
          pollDeploymentStatus(id);
        }
      }, 3000);

      // Initial poll
      if (id) {
        pollDeploymentStatus(id);
      }
    }

    // Cleanup on unmount or when status changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [previewUrl, deploymentStatus, id, pollDeploymentStatus]);

  // Check deployment status when generation completes
  // Backend auto-deploys after generation, so we just need to check for existing preview
  useEffect(() => {
    const shouldCheckStatus = generation?.response?.files && 
                              generation.response.files.length > 0 &&
                              !hasGeneratedInitialPreview &&
                              generation.id;

    if (shouldCheckStatus) {
      // Mark as checked to avoid repeated calls
      setHasGeneratedInitialPreview(true);
      
      // Check if preview already exists from backend auto-deploy
      pollDeploymentStatus(generation.id);
    }
  }, [generation?.response?.files, hasGeneratedInitialPreview, generation?.id, pollDeploymentStatus]);

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

        if (data.data && data.data.previewUrl) {
          setPreviewUrl(withCacheBust(data.data.previewUrl));
          if (!hasGeneratedInitialPreview) {
            setHasGeneratedInitialPreview(true);
            setActiveTab('preview');
          }
          
          // Log if using cached preview
          if (data.data.cached) {
            console.log('Using cached preview URL');
            setDeploymentStatus('ready');
            setIframeKey(Date.now());
          } else {
            console.log('Deployment started, waiting for it to be ready...');
            // Start polling for new deployments
            setDeploymentStatus('deploying');
          }
        } else {
          console.error('previewUrl not found in response:', data);
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
      console.log(`🔄 Chat job ${jobId} started, polling for results...`);

      // Poll for results
      const pollInterval = 1000; // Poll every 1 second
      const maxAttempts = 120; // Max 2 minutes
      let attempts = 0;
      let data: any = null;

      while (attempts < maxAttempts) {
        attempts++;
        
        const statusRes = await apiClient.getChatStatus(jobId);
        
        if (!statusRes.success || !statusRes.data) {
          throw new Error(statusRes.error || 'Failed to check chat status');
        }

        const status = statusRes.data.status;
        console.log(`📊 Chat job ${jobId} status: ${status} (attempt ${attempts}/${maxAttempts})`);

        if (status === 'completed') {
          data = statusRes.data;
          console.log('✅ Chat job completed!');
          break;
        } else if (status === 'error') {
          throw new Error(statusRes.data.error || 'Chat job failed');
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
        const previewResponse = await fetch('/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            generationId: id,
            files: data.files,
            forceRegenerate: true // Force regenerate because code changed
          }),
        });

        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          if (previewData.data && previewData.data.previewUrl) {
            setPreviewUrl(withCacheBust(previewData.data.previewUrl));
            if (!hasGeneratedInitialPreview) {
              setHasGeneratedInitialPreview(true);
            }
            
            // Start polling for deployment readiness
            console.log('New deployment triggered, waiting for it to be ready...');
            setDeploymentStatus('deploying');
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
                  disabled={!generation || isGenerating || isGeneratingPreview}
                  className="btn btn-primary"
                >
                  {isGeneratingPreview ? 'GENERATING...' : 'REGENERATE PREVIEW'}
                </button>
                {previewUrl && (
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
                    🔄 Deploying...
                  </span>
                )}
                {deploymentStatus === 'ready' && (
                  <span className="deployment-status ready">
                    ✅ Live
                  </span>
                )}
              </div>
              {previewUrl ? (
                <>
                  {deploymentStatus === 'deploying' && (
                    <div className="deployment-overlay">
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
    ║      Preview will auto-refresh    ║
    ║      when deployment is ready     ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  <iframe 
                    key={iframeKey} 
                    src={previewUrl} 
                    title="Preview"
                    style={{ opacity: deploymentStatus === 'deploying' ? 0.3 : 1 }}
                  />
                </>
              ) : (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      GENERATING PREVIEW...        ║
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
