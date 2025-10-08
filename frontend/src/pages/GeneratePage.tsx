import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GenerationForm, GenerationOptions } from '../components/GenerationForm';
import { useGeneration } from '../hooks/useGeneration';
import '../styles/theme.css';
import './GeneratePage.css';

export const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { isGenerating, currentGeneration, generate } = useGeneration();

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

  // Navigate to session page when generation starts
  useEffect(() => {
    if (currentGeneration?.id) {
      navigate(`/generate/${currentGeneration.id}`);
    }
  }, [currentGeneration?.id, navigate]);

  return (
    <Layout className="generate-page-layout">
      <div className="generate-page generate-page-form-only">
        <div className="form-container-centered">
          <div className="welcome-banner terminal-window">
            <div className="terminal-content">
              <pre className="ascii-logo phosphor-glow">
{`    ╔��══════════════════════════════════╗
    ║                                   ║
    ║      CODEFORGE AI GENERATOR       ║
    ║                                   ║
    ║   ►  Describe your project        ║
    ║   ►  Select your preferences      ║
    ║   ►  Let AI build it for you      ║
    ║                                   ║
    ╚═══════════════════════════════════╝`}
              </pre>
            </div>
          </div>
          <GenerationForm onSubmit={handleGenerate} isGenerating={isGenerating} />
        </div>
      </div>
    </Layout>
  );
};
