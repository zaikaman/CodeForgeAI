import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AgentChat, AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
import { useGenerationStore } from '../stores/generationStore';
import apiClient from '../services/apiClient';
import '../styles/theme.css';
import './GenerateSessionPage.css';

export const GenerateSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('source');
  const [chatInput, setChatInput] = useState('');
  
  const store = useGenerationStore();
  const { 
    currentGeneration, 
    isGenerating, 
    getGenerationById, 
    updateGenerationFiles, 
    addMessageToGeneration,
    setIsGenerating,
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

  // Auto-select first file when generation completes
  useEffect(() => {
    if (generation?.response?.files && generation.response.files.length > 0) {
      setSelectedFile(generation.response.files[0]);
    }
  }, [generation]);

  const handleSelectFile = (file: { path: string; content: string }) => {
    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (generation && generation.response?.files) {
      try {
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            generationId: generation.id,
            files: generation.response.files 
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.previewUrl) {
          setPreviewUrl(data.data.previewUrl);
          setActiveTab('preview');
        } else {
          console.error('previewUrl not found in response:', data);
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !generation || !id) return;

    const userMessage = chatInput.trim();
    
    // Clear input immediately
    setChatInput('');

    // Add user message to chat immediately
    const userAgentMessage: AgentMessage = {
      id: `msg_${Date.now()}_user`,
      agent: 'User',
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    addMessageToGeneration(id, userAgentMessage);

    // Set generating state
    setIsGenerating(true);

    try {
      // Call chat API
      const apiRes = await apiClient.chat({
        generationId: id,
        message: userMessage,
        currentFiles: generation.response?.files || [],
        language: generation.response?.language || 'typescript',
      });

      if (!apiRes.success || !apiRes.data) {
        throw new Error(apiRes.error || 'Chat request failed');
      }

      const data = apiRes.data;

      // Add agent response message
      const agentResponseMessage: AgentMessage = {
        id: `msg_${Date.now()}_agent`,
        agent: data.agentThought.agent,
        role: 'agent',
        content: data.agentThought.thought,
        timestamp: new Date(),
      };
      addMessageToGeneration(id, agentResponseMessage);

      // Update files in the generation
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
              className="btn-back"
              onClick={() => navigate('/generate')}
            >
              ◄ NEW GENERATION
            </button>
          </div>

          {activeTab === 'source' && (
            <div className="source-code-view">
              <FileTree 
                files={generation?.response?.files || []} 
                onSelectFile={handleSelectFile} 
              />
              <CodeEditor
                value={selectedFile?.content || '// Select a file to view its content'}
                onChange={() => {}}
                language={selectedFile?.path.split('.').pop() || 'typescript'}
                readOnly={true}
                title={selectedFile?.path || 'CODEFORGE EDITOR V1.0.0'}
                height="100%"
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="preview-view">
              <button 
                onClick={handlePreview} 
                disabled={!generation || isGenerating}
                className="btn btn-primary"
              >
                GENERATE PREVIEW
              </button>
              {previewUrl ? (
                <iframe src={previewUrl} title="Preview" />
              ) : (
                <div className="no-preview">
                  <div className="terminal-window">
                    <div className="terminal-content">
                      <pre className="ascii-logo phosphor-glow">
{`    ╔═══════════════════════════════════╗
    ║                                   ║
    ║      PREVIEW NOT GENERATED        ║
    ║                                   ║
    ║   ►  Click "GENERATE PREVIEW"     ║
    ║      to see live preview          ║
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
