import React, { useState, useRef } from 'react';
import { FileUpload, UploadedFile } from './FileUpload';
import { useAuthContext } from '../contexts/AuthContext';
import { useSoundEffects } from '../hooks/useSoundEffects';
import '../styles/theme.css';
import './ChatInput.css';

export interface ChatInputMessage {
  text: string;
  imageUrls?: string[];
}

interface ChatInputProps {
  onSend: (message: ChatInputMessage) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showImageUpload?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  className = '',
  showImageUpload = true,
}) => {
  const [text, setText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuthContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playClick, playToggle, playType } = useSoundEffects();
  const lastTypeTimeRef = useRef<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && uploadedImages.length === 0) return;

    const imageUrls = uploadedImages.map(img => img.url);
    onSend({
      text: text.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });

    // Clear input
    setText('');
    setUploadedImages([]);
    setShowUpload(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Play typing sound (throttled to avoid too many sounds)
    const now = Date.now();
    if (now - lastTypeTimeRef.current > 100) {
      playType();
      lastTypeTimeRef.current = now;
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImagesChange = (files: UploadedFile[]) => {
    setUploadedImages(files);
  };

  const toggleUpload = () => {
    setShowUpload(!showUpload);
  };

  return (
    <div className={`chat-input terminal-window ${className}`}>
      <div className="terminal-content">
        <form onSubmit={handleSubmit} className="chat-input-form">
          {/* Image Upload Section */}
          {showImageUpload && user && showUpload && (
            <div className="chat-input-upload-section">
              <FileUpload
                userId={user.id}
                folder="chat"
                maxFiles={3}
                onFilesChange={handleImagesChange}
                disabled={disabled}
              />
            </div>
          )}

          {/* Input Row */}
          <div className="chat-input-row">
            {/* Image Upload Toggle Button */}
            {showImageUpload && user && (
              <button
                type="button"
                className={`btn-image-toggle ${showUpload ? 'active' : ''}`}
                onClick={() => {
                  playToggle();
                  toggleUpload();
                }}
                disabled={disabled}
                title="Attach images"
              >
                <span className="icon">◈</span>
              </button>
            )}

            {/* Text Input */}
            <div className="input-wrapper">
              <span className="input-prefix">&gt;&gt;</span>
              <textarea
                ref={textareaRef}
                className="input chat-textarea"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="btn btn-primary btn-send"
              disabled={disabled || (!text.trim() && uploadedImages.length === 0)}
              title="Send message (Enter)"
              onClick={() => playClick()}
            >
              <span className="icon">►</span>
              SEND
            </button>
          </div>

          {/* Hint */}
          <div className="chat-input-hint text-muted">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {uploadedImages.length > 0 && (
              <span className="image-count">
                {uploadedImages.length} image(s) attached
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
