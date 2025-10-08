import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { GenerationForm, GenerationOptions } from '../components/GenerationForm';
import { CodeEditor } from '../components/CodeEditor';
import { FileTree } from '../components/FileTree';
// import { AgentChat } from '../components/AgentChat';
import { useGeneration } from '../hooks/useGeneration';
import '../styles/theme.css';
import './GeneratePage.css';

export const GeneratePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('source');
  const { isGenerating, currentGeneration, generate, /*agentMessages*/ } = useGeneration();

  const handleGenerate = async (options: GenerationOptions) => {
    try {
      await generate({
        prompt: options.prompt,
        projectContext: options.projectContext,
        includeTests: options.includeTests,
        includeDocumentation: options.includeDocumentation,
        targetLanguage: options.targetLanguage,
        complexity: options.complexity,
        agents: options.agents,
      });
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleSelectFile = (file: { path: string; content: string }) => {
    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (currentGeneration) {
      try {
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ generationId: currentGeneration.id }),
        });

        console.log('Preview response:', response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Preview data:', data);

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

  useEffect(() => {
    if (currentGeneration?.response?.files && currentGeneration.response.files.length > 0) {
      setSelectedFile(currentGeneration.response.files[0]);
    }
  }, [currentGeneration]);

  return (
    <Layout className="generate-page-layout">
      <div className="generate-page">
        <div className="left-panel">
          {/* <AgentChat messages={agentMessages} isStreaming={isGenerating} agentStatus={isGenerating ? 'PROCESSING' : 'STANDBY'} /> */}
          <GenerationForm onSubmit={handleGenerate} isGenerating={isGenerating} />
        </div>
        <div className="right-panel">
          <div className="tabs">
            <button className={activeTab === 'source' ? 'active' : ''} onClick={() => setActiveTab('source')}>Source Code</button>
            <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Preview</button>
          </div>
          {activeTab === 'source' && (
            <div className="source-code-view">
              <FileTree files={currentGeneration?.response?.files || []} onSelectFile={handleSelectFile} />
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
              <button onClick={handlePreview} disabled={!currentGeneration || isGenerating}>Generate Preview</button>
              {previewUrl ? <iframe src={previewUrl} title="Preview" /> : <div className="no-preview">Click "Generate Preview" to see the live preview.</div>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
