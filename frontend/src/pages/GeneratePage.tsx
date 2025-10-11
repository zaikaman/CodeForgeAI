import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GenerationForm, GenerationOptions } from '../components/GenerationForm';
import { useGeneration } from '../hooks/useGeneration';
import '../styles/theme.css';
import './GeneratePage.css';

export const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { isGenerating, generate } = useGeneration();

  const handleGenerate = async (options: GenerationOptions) => {
    try {
      const generationId = await generate({
        prompt: options.prompt,
        projectContext: options.projectContext,
        targetLanguage: options.targetLanguage,
        complexity: options.complexity,
        agents: options.agents,
        imageUrls: options.imageUrls,
      });
      
      // Navigate with the backend UUID
      if (generationId) {
        console.log(`[GeneratePage] Navigating to /generate/${generationId}`);
        navigate(`/generate/${generationId}`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  // Removed auto-navigation useEffect - we navigate manually after getting ID

  return (
    <Layout className="generate-page-layout">
      <div className="generate-page generate-page-form-only">
        <div className="form-container-centered">
          {/*
          <div className="welcome-banner terminal-window">
            <div className="terminal-header">
              <div className="terminal-button close"></div>
              <div className="terminal-button minimize"></div>
              <div className="terminal-button maximize"></div>
              <div className="terminal-title">CODEFORGE AI - CODE GENERATION SYSTEM</div>
            </div>
            <div className="terminal-content">
              <div className="banner-header">
                <div className="banner-icon phosphor-glow">▣</div>
                <h1 className="banner-title">CODE GENERATION</h1>
              </div>
              <div className="banner-description">
                <p>Transform your ideas into production-ready code with AI-powered multi-agent system.</p>
              </div>
              <div className="banner-features">
                <div className="feature-item">
                  <span className="feature-icon">►</span>
                  <span>Describe your project in natural language</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">►</span>
                  <span>Configure generation options & select specialized agents</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">►</span>
                  <span>Get production-ready code with tests & documentation</span>
                </div>
              </div>
              <div className="banner-status">
                <span className="status-badge badge-success">
                  <span className="status-dot"></span>
                  SYSTEM ONLINE
                </span>
                <span className="status-badge badge-info">
                  <span className="status-dot"></span>
                  AGENTS READY
                </span>
              </div>
            </div>
          </div>
          */}
          <GenerationForm onSubmit={handleGenerate} isGenerating={isGenerating} />
        </div>
      </div>
    </Layout>
  );
};
