import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import './VapiCallAgent.css';

interface VapiCallAgentProps {
  className?: string;
  compact?: boolean; // Compact mode for toolbar integration
}

export const VapiCallAgent: React.FC<VapiCallAgentProps> = ({ className = '', compact = false }) => {
  const { user } = useAuthContext();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Vapi client ONLY ONCE
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error('[VapiCallAgent] VITE_VAPI_PUBLIC_KEY not found in environment');
      console.error('[VapiCallAgent] Please add VITE_VAPI_PUBLIC_KEY to your .env file');
      return;
    }

    // Dynamically load Vapi SDK
    const loadVapiSDK = async () => {
      try {
        // Import from npm package
        const VapiModule = await import('@vapi-ai/web');
        const Vapi = VapiModule.default;
        
        vapiRef.current = new Vapi(publicKey);
        console.log('[VapiCallAgent] Vapi SDK loaded successfully');

        // Setup event listeners
        const vapi = vapiRef.current;

        vapi.on('call-start', () => {
          console.log('[VapiCallAgent] Call started');
          setIsCallActive(true);
          setIsConnecting(false);
          setCallStatus('Connected');
        });

        vapi.on('call-end', () => {
          console.log('[VapiCallAgent] Call ended');
          setIsCallActive(false);
          setIsConnecting(false);
          setCallStatus('');
          setVolumeLevel(0);
        });

        vapi.on('speech-start', () => {
          console.log('[VapiCallAgent] Assistant started speaking');
          setCallStatus('Speaking...');
        });

        vapi.on('speech-end', () => {
          console.log('[VapiCallAgent] Assistant stopped speaking');
          setCallStatus('Listening...');
        });

        vapi.on('volume-level', (volume: number) => {
          setVolumeLevel(volume);
        });

        vapi.on('message', (message: any) => {
          console.log('[VapiCallAgent] Message:', message);
          
          // Handle tool call results if needed
          if (message.type === 'function-call') {
            console.log('[VapiCallAgent] Function call:', message);
          }
        });

        vapi.on('error', (error: any) => {
          console.error('[VapiCallAgent] Error:', error);
          setCallStatus('Error: ' + (error.message || 'Unknown error'));
          setIsConnecting(false);
        });
      } catch (error) {
        console.error('[VapiCallAgent] Failed to load Vapi SDK:', error);
      }
    };

    loadVapiSDK();

    return () => {
      // Cleanup: stop call if component unmounts
      if (vapiRef.current) {
        console.log('[VapiCallAgent] Component unmounting, stopping call...');
        vapiRef.current.stop();
      }
    };
  }, []); // Empty dependency array - only run once!

  const startCall = async () => {
    if (!vapiRef.current || !user) return;

    try {
      setIsConnecting(true);
      setCallStatus('Connecting...');

      // Use the assistant ID from VAPI Dashboard
      const assistantId = 'cfee51bf-9550-4ed6-bba5-5489f42e5f9e';

      // Assistant overrides to pass user context
      const assistantOverrides = {
        variableValues: {
          userId: user.id,
        },
        serverUrlSecret: user.id, // Pass user ID for backend authentication
      };

      console.log('[VapiCallAgent] Starting call with assistant:', assistantId);
      await vapiRef.current.start(assistantId, assistantOverrides);
    } catch (error) {
      console.error('[VapiCallAgent] Failed to start call:', error);
      setCallStatus('Failed to connect');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    console.log('[VapiCallAgent] endCall() called');
    console.log('[VapiCallAgent] vapiRef.current exists:', !!vapiRef.current);
    console.log('[VapiCallAgent] isCallActive:', isCallActive);
    
    if (vapiRef.current) {
      try {
        console.log('[VapiCallAgent] Calling vapi.stop()...');
        vapiRef.current.stop();
        console.log('[VapiCallAgent] vapi.stop() completed');
        
        // Force reset state immediately
        setIsCallActive(false);
        setIsConnecting(false);
        setCallStatus('');
        setVolumeLevel(0);
        
        console.log('[VapiCallAgent] State reset complete');
      } catch (error) {
        console.error('[VapiCallAgent] Error stopping call:', error);
        
        // Force reset state even if stop() failed
        setIsCallActive(false);
        setIsConnecting(false);
        setCallStatus('');
        setVolumeLevel(0);
      }
    } else {
      console.warn('[VapiCallAgent] Cannot stop call - vapiRef.current is null');
    }
  };

  // Compact mode for toolbar
  if (compact) {
    return (
      <div className="vapi-call-compact">
        {!isCallActive && !isConnecting ? (
          <button
            className="btn-call-compact"
            onClick={startCall}
            disabled={!user}
            title="Start voice call with CodeForge AI"
          >
            🎙️
          </button>
        ) : (
          <button
            className="btn-call-compact active"
            onClick={endCall}
            title={isConnecting ? 'Connecting...' : 'End call'}
          >
            {isConnecting ? '⏳' : '📞'}
          </button>
        )}
      </div>
    );
  }

  // Full mode for welcome screen
  return (
    <div className={`vapi-call-agent ${className}`}>
      <div className="call-agent-container">
        {!isCallActive && !isConnecting ? (
          <button
            className="btn-start-call"
            onClick={startCall}
            disabled={!user}
            title={!user ? 'Please login to use voice assistant' : 'Start voice call with CodeForge AI'}
          >
            <span className="icon">🎤</span>
            <span className="text">Call CodeForge Agent</span>
          </button>
        ) : (
          <div className="call-active-ui">
            <div className="call-status-display">
              <div className="status-indicator">
                <div className={`pulse-dot ${isCallActive ? 'active' : 'connecting'}`} />
                <span className="status-text">{callStatus}</span>
              </div>
              
              {isCallActive && (
                <div className="volume-meter">
                  <div 
                    className="volume-bar" 
                    style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            <button
              className="btn-end-call"
              onClick={endCall}
              disabled={isConnecting}
            >
              <span className="icon">📞</span>
              <span className="text">End Call</span>
            </button>
          </div>
        )}
      </div>

      {isCallActive && (
        <div className="call-instructions">
          <p>🎙️ Speak naturally - tell me what you want to build!</p>
          <p className="example-text">
            Example: "Create a Versace landing page with React"
          </p>
        </div>
      )}
    </div>
  );
};
