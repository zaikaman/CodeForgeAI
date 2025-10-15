import React, { useRef, useState } from 'react';
import {
  uploadFile,
  validateFile,
  deleteFile,
  getFileIcon,
  isImageFile,
  formatFileSize,
  getAcceptString,
} from '../services/fileUploadService';
import '../styles/theme.css';
import './ImageUpload.css';

export interface UploadedFile {
  url: string;
  path: string;
  file: File;
  isImage: boolean;
  icon: string;
}

interface FileUploadProps {
  userId: string;
  folder?: string;
  maxFiles?: number;
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  className?: string;
  acceptImagesOnly?: boolean; // Backward compatibility
}

export const FileUpload: React.FC<FileUploadProps> = ({
  userId,
  folder = 'chat',
  maxFiles = 5,
  onFilesChange,
  disabled = false,
  className = '',
  acceptImagesOnly = false,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload file
        const result = await uploadFile(file, userId, folder);
        if (result.error) {
          throw new Error(result.error);
        }

        return {
          url: result.url,
          path: result.path,
          file,
          isImage: isImageFile(file.name),
          icon: getFileIcon(file.name),
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = files[index];
    
    // Delete from storage
    await deleteFile(fileToRemove.path);

    // Update state
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const acceptString = acceptImagesOnly ? 'image/*' : getAcceptString();

  return (
    <div className={`image-upload ${className}`}>
      {/* Upload Button */}
      <div className="upload-controls">
        <button
          type="button"
          className="btn-upload"
          onClick={handleButtonClick}
          disabled={disabled || uploading || files.length >= maxFiles}
        >
          {uploading ? (
            <>
              <span className="upload-icon spinning">◉</span>
              UPLOADING...
            </>
          ) : (
            <>
              <span className="upload-icon">📎</span>
              {acceptImagesOnly ? 'ATTACH IMAGE' : 'ATTACH FILE'}
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        <span className="upload-hint text-muted">
          {files.length}/{maxFiles} files • {acceptImagesOnly ? 'Images only (10MB)' : 'Docs, images, code (20MB)'}
        </span>
      </div>

      {/* Supported formats info */}
      {!acceptImagesOnly && files.length === 0 && (
        <div className="upload-hint text-muted mt-xs" style={{ fontSize: '0.75rem' }}>
          Supports: PDF, DOCX, TXT, MD, CSV, JSON, XLSX, PPTX, images, code files, and more
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="upload-error text-danger mt-sm">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="image-preview-grid mt-md">
          {files.map((uploadedFile, index) => (
            <div key={index} className="image-preview-item">
              {uploadedFile.isImage ? (
                <img 
                  src={uploadedFile.url} 
                  alt={`Upload ${index + 1}`} 
                  className="preview-image" 
                />
              ) : (
                <div className="preview-file-icon">
                  <span style={{ fontSize: '3rem' }}>{uploadedFile.icon}</span>
                  <span className="file-extension">
                    {uploadedFile.file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="btn-remove-image"
                onClick={() => handleRemoveFile(index)}
                disabled={disabled}
                title="Remove file"
              >
                ✕
              </button>
              <div className="image-info">
                <span className="image-name" title={uploadedFile.file.name}>
                  {uploadedFile.file.name}
                </span>
                <span className="image-size">
                  {formatFileSize(uploadedFile.file.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Backward compatibility export
export const ImageUpload = FileUpload;
export type UploadedImage = UploadedFile;
