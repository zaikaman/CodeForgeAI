import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AgentChat, AgentMessage } from '../components/AgentChat';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
import { useGenerationStore } from '../stores/generationStore';
import '../styles/theme.css';
import './GenerateSessionPage.css';

export const GenerateSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('source');
  const [chatInput, setChatInput] = useState('');
  const [generation, setGeneration] = useState<any>(null);
  
  const { currentGeneration, isGenerating, agentMessages, getGenerationById } = useGenerationStore();

  // Load generation from current or history
  useEffect(() => {
    if (id) {
      if (currentGeneration?.id === id) {
        setGeneration(currentGeneration);
      } else {
        const historicalGeneration = getGenerationById(id);
        if (historicalGeneration) {
          setGeneration(historicalGeneration);
        } else {
          // Generation not found, redirect to generate page
          navigate('/generate');
        }
      }
    }
  }, [id, currentGeneration, getGenerationById, navigate]);

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
    if (!chatInput.trim()) return;

    // TODO: Implement chat message sending to AI
    console.log('Sending message:', chatInput);
    
    // Clear input
    setChatInput('');
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
            messages={generation?.agentMessages || agentMessages} 
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
