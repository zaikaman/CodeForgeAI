import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/uiStore';
import apiClient from '../services/apiClient';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { 
    theme, 
    setTheme, 
    showToast,
    crtEffects,
    phosphorGlow,
    autoScrollChat,
    soundEffects,
    setPreference,
    loadPreferences
  } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'account' | 'theme' | 'preferences' | 'danger'>('account');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load theme from localStorage first (this is the source of truth)
      const savedTheme = localStorage.getItem('codeforge-theme') as 'blue' | 'green' | null;
      if (savedTheme && (savedTheme === 'blue' || savedTheme === 'green')) {
        setTheme(savedTheme);
      }
      
      // Then load backend settings
      const response = await apiClient.getSettings();

      if (response.data) {
        // Only use backend theme if localStorage doesn't have one
        if (response.data.theme && !savedTheme) {
          setTheme(response.data.theme);
        }
        
        // Load preferences into UIStore
        loadPreferences({
          crtEffects: response.data.crtEffects ?? false,
          phosphorGlow: response.data.phosphorGlow ?? true,
          autoScrollChat: response.data.autoScrollChat ?? true,
          soundEffects: response.data.soundEffects ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = async (selectedTheme: 'blue' | 'green') => {
    // Update theme in UI store (which will also update localStorage via subscription)
    setTheme(selectedTheme);
    const themeName = selectedTheme === 'blue' ? 'BLUE MODE' : 'GREEN PHOSPHOR';
    
    try {
      // Save to backend as well
      await apiClient.updatePreferences({ theme: selectedTheme });
      showToast('success', `Theme changed to ${themeName}`);
    } catch (error: any) {
      console.warn('Failed to save theme to backend:', error);
      // Don't show error toast - localStorage persistence is more important
      // Backend sync is optional
      showToast('success', `Theme changed to ${themeName}`);
    }
  };

  const handlePreferenceChange = async (key: 'crtEffects' | 'phosphorGlow' | 'autoScrollChat' | 'soundEffects') => {
    // Get current value from store
    const currentValue = useUIStore.getState()[key];
    const newValue = !currentValue;
    
    // Update UI store immediately
    setPreference(key, newValue);

    try {
      // Sync to backend
      await apiClient.updatePreferences({ [key]: newValue });
      showToast('success', 'Preference updated');
    } catch (error: any) {
      // Revert on error
      setPreference(key, currentValue);
      showToast('error', error.message || 'Failed to update preference');
    }
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING ⚠️\n\n' +
      'This will delete:\n' +
      '• All chat history (all conversations in sidebar)\n' +
      '• All generation history\n' +
      '• All saved preferences\n' +
      '• API keys and settings\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await apiClient.deleteSettings();
      
      // Clear local storage and stores
      localStorage.clear();
      
      showToast('success', 'All data cleared successfully. Reloading...');
      
      // Reload the page to clear all state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to clear data');
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      '⚠️ DANGER: ACCOUNT DELETION ⚠️\n\n' +
      'This will PERMANENTLY delete:\n' +
      '• Your entire account\n' +
      '• All generation history\n' +
      '• All chat conversations\n' +
      '• All saved data and preferences\n\n' +
      'This action is IRREVERSIBLE and CANNOT be undone!\n\n' +
      'Do you want to proceed?'
    );

    if (!firstConfirm) return;

    const confirmation = window.prompt(
      'To confirm account deletion, please type exactly:\n\n' +
      'DELETE MY ACCOUNT\n\n' +
      '(Case sensitive)'
    );

    if (confirmation !== 'DELETE MY ACCOUNT') {
      if (confirmation !== null) {
        showToast('error', 'Confirmation text does not match. Account deletion cancelled.');
      }
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteAccount('DELETE MY ACCOUNT');
      
      showToast('success', 'Account data deleted successfully');
      
      // Sign out after a brief delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal terminal-window">
          <div className="terminal-header">
            <div className="terminal-button close" onClick={onClose}></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
            <div className="terminal-title">SYSTEM CONFIGURATION</div>
          </div>

          <div className="settings-modal-content">
            {/* Sidebar Tabs */}
            <div className="settings-sidebar">
              <button
                className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <span className="tab-icon">👤</span>
                <span className="tab-label">ACCOUNT</span>
              </button>
              <button
                className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`}
                onClick={() => setActiveTab('theme')}
              >
                <span className="tab-icon">🎨</span>
                <span className="tab-label">THEME</span>
              </button>
              <button
                className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <span className="tab-icon">⚙</span>
                <span className="tab-label">PREFERENCES</span>
              </button>
              <button
                className={`settings-tab ${activeTab === 'danger' ? 'active' : ''}`}
                onClick={() => setActiveTab('danger')}
              >
                <span className="tab-icon">⚠</span>
                <span className="tab-label">DANGER ZONE</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="settings-content-area">
              {loading ? (
                <div className="settings-loading">
                  <p className="text-muted">&gt; Loading settings...</p>
                </div>
              ) : (
                <>
                  {/* Account Tab */}
                  {activeTab === 'account' && (
                    <div className="settings-tab-content">
                      <h2 className="settings-content-title phosphor-glow">◆ ACCOUNT INFORMATION</h2>
                      
                      <div className="setting-group mt-md">
                        <div className="setting-label text-muted">&gt; OPERATOR ID:</div>
                        <div className="setting-value text-primary">{user?.email || 'Not authenticated'}</div>
                      </div>

                      <div className="setting-group mt-md">
                        <div className="setting-label text-muted">&gt; USER ID:</div>
                        <div className="setting-value text-primary font-mono">{user?.id || 'N/A'}</div>
                      </div>

                      <div className="setting-group mt-md">
                        <div className="setting-label text-muted">&gt; ACCOUNT STATUS:</div>
                        <div className="setting-value text-success phosphor-glow">ACTIVE</div>
                      </div>
                    </div>
                  )}

                  {/* Theme Tab */}
                  {activeTab === 'theme' && (
                    <div className="settings-tab-content">
                      <h2 className="settings-content-title phosphor-glow">◆ DISPLAY THEME</h2>
                      
                      <div className="theme-options mt-md">
                        <div className="theme-option">
                          <div className="theme-sample blue-theme">
                            <div className="sample-text phosphor-glow">BLUE MODE</div>
                            <div className="sample-bar"></div>
                          </div>
                          <button
                            className={`btn ${theme === 'blue' ? 'btn-primary' : ''}`}
                            onClick={() => handleThemeSelect('blue')}
                            disabled={theme === 'blue'}
                          >
                            {theme === 'blue' ? '◉ ACTIVE' : 'SELECT'}
                          </button>
                        </div>

                        <div className="theme-option mt-md">
                          <div className="theme-sample green-theme">
                            <div className="sample-text phosphor-glow">GREEN PHOSPHOR</div>
                            <div className="sample-bar"></div>
                          </div>
                          <button
                            className={`btn ${theme === 'green' ? 'btn-primary' : ''}`}
                            onClick={() => handleThemeSelect('green')}
                            disabled={theme === 'green'}
                          >
                            {theme === 'green' ? '◉ ACTIVE' : 'SELECT'}
                          </button>
                        </div>
                      </div>

                      <div className="setting-hint text-muted mt-lg">
                        &gt; Theme changes apply immediately across all sessions
                      </div>
                    </div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <div className="settings-tab-content">
                      <h2 className="settings-content-title phosphor-glow">◆ SYSTEM PREFERENCES</h2>
                      
                      <div className="preference-list mt-md">
                        <div className="preference-item">
                          <div className="preference-info">
                            <div className="preference-title">CRT EFFECTS</div>
                            <div className="preference-desc text-muted">Scanlines and flicker animation</div>
                          </div>
                          <label className="preference-toggle">
                            <input
                              type="checkbox"
                              checked={crtEffects}
                              onChange={() => handlePreferenceChange('crtEffects')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="preference-item mt-md">
                          <div className="preference-info">
                            <div className="preference-title">PHOSPHOR GLOW</div>
                            <div className="preference-desc text-muted">Text glow effects</div>
                          </div>
                          <label className="preference-toggle">
                            <input
                              type="checkbox"
                              checked={phosphorGlow}
                              onChange={() => handlePreferenceChange('phosphorGlow')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="preference-item mt-md">
                          <div className="preference-info">
                            <div className="preference-title">AUTO-SCROLL CHAT</div>
                            <div className="preference-desc text-muted">Automatically scroll agent messages</div>
                          </div>
                          <label className="preference-toggle">
                            <input
                              type="checkbox"
                              checked={autoScrollChat}
                              onChange={() => handlePreferenceChange('autoScrollChat')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="preference-item mt-md">
                          <div className="preference-info">
                            <div className="preference-title">SOUND EFFECTS</div>
                            <div className="preference-desc text-muted">Terminal sound effects</div>
                          </div>
                          <label className="preference-toggle">
                            <input
                              type="checkbox"
                              checked={soundEffects}
                              onChange={() => handlePreferenceChange('soundEffects')}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danger Zone Tab */}
                  {activeTab === 'danger' && (
                    <div className="settings-tab-content">
                      <h2 className="settings-content-title text-error phosphor-glow">◆ DANGER ZONE</h2>
                      
                      <div className="danger-actions mt-md">
                        <div className="danger-item">
                          <div>
                            <div className="danger-title">CLEAR ALL DATA</div>
                            <div className="danger-desc text-muted">
                              Remove all generation history and cached data
                            </div>
                          </div>
                          <button className="btn btn-danger mt-sm" onClick={handleClearData}>
                            CLEAR DATA
                          </button>
                        </div>

                        <div className="danger-item mt-md">
                          <div>
                            <div className="danger-title">DELETE ACCOUNT</div>
                            <div className="danger-desc text-muted">
                              Permanently delete account and all associated data
                            </div>
                          </div>
                          <button className="btn btn-danger mt-sm" onClick={handleDeleteAccount}>
                            DELETE ACCOUNT
                          </button>
                        </div>
                      </div>

                      <div className="setting-hint text-error mt-lg">
                        ⚠ WARNING: These actions are irreversible
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
