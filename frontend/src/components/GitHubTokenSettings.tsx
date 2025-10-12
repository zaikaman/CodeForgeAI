import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const GitHubTokenSettings: React.FC = () => {
  const { user } = useAuthContext();
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing token from user metadata
    if (user?.user_metadata?.github_token) {
      setToken(user.user_metadata.github_token);
    }
  }, [user]);

  const handleSave = async () => {
    if (!token || token.length < 10) {
      setError('Please enter a valid GitHub token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save token to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          github_token: token,
        },
      });

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: {
          github_token: null,
        },
      });
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="github-token-settings">
      <div className="setting-section">
        <h3>🔗 GitHub Integration</h3>
        <p className="setting-description">
          Connect your GitHub account to enable repository operations through chat.
        </p>

        <div className="token-input-group">
          <label htmlFor="github-token">GitHub Personal Access Token</label>
          <input
            id="github-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="token-input"
          />
          <p className="input-hint">
            Generate a token at{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,user:email"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Settings → Developer settings → Personal access tokens
            </a>
          </p>
          <p className="input-hint">
            Required scopes: <code>repo</code>, <code>user:email</code>
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {saved && <div className="success-message">✓ GitHub token saved successfully!</div>}

        <div className="button-group">
          <button
            onClick={handleSave}
            disabled={loading || !token}
            className="primary-button"
          >
            {loading ? 'Saving...' : 'Save Token'}
          </button>
          {token && (
            <button
              onClick={handleRemove}
              disabled={loading}
              className="secondary-button"
            >
              Remove Token
            </button>
          )}
        </div>
      </div>

      <style>{`
        .github-token-settings {
          padding: 24px;
          max-width: 600px;
        }

        .setting-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .setting-section h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #00ff41;
        }

        .setting-description {
          margin: 0 0 24px 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .token-input-group {
          margin-bottom: 16px;
        }

        .token-input-group label {
          display: block;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .token-input {
          width: 100%;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }

        .token-input:focus {
          outline: none;
          border-color: #00ff41;
        }

        .input-hint {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .input-hint a {
          color: #00ff41;
          text-decoration: none;
        }

        .input-hint a:hover {
          text-decoration: underline;
        }

        .input-hint code {
          background: rgba(0, 255, 65, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          color: #00ff41;
        }

        .error-message {
          padding: 12px;
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 8px;
          color: #ff4444;
          margin-bottom: 16px;
        }

        .success-message {
          padding: 12px;
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid rgba(0, 255, 65, 0.3);
          border-radius: 8px;
          color: #00ff41;
          margin-bottom: 16px;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .primary-button,
        .secondary-button {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-button {
          background: #00ff41;
          color: black;
        }

        .primary-button:hover:not(:disabled) {
          background: #00cc34;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .secondary-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};
