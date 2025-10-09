import React, { useRef, useState } from 'react';
import { uploadImage, validateImageFile, deleteImage } from '../services/imageUploadService';
import '../styles/theme.css';
import './ImageUpload.css';

export interface UploadedImage {
  url: string;
  path: string;
  file: File;
}

interface ImageUploadProps {
  userId: string;
  folder?: string;
  maxImages?: number;
  onImagesChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  userId,
  folder = 'chat',
  maxImages = 5,
  onImagesChange,
  disabled = false,
  className = '',
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload file
        const result = await uploadImage(file, userId, folder);
        if (result.error) {
          throw new Error(result.error);
        }

        return {
          url: result.url,
          path: result.path,
          file,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onImagesChange(newImages);
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

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    
    // Delete from storage
    await deleteImage(imageToRemove.path);

    // Update state
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload ${className}`}>
      {/* Upload Button */}
      <div className="upload-controls">
        <button
          type="button"
          className="btn-upload"
          onClick={handleButtonClick}
          disabled={disabled || uploading || images.length >= maxImages}
        >
          {uploading ? (
            <>
              <span className="upload-icon spinning">◉</span>
              UPLOADING...
            </>
          ) : (
            <>
              <span className="upload-icon">◈</span>
              ATTACH IMAGE
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        <span className="upload-hint text-muted">
          {images.length}/{maxImages} images (Max 5MB each)
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="upload-error text-danger mt-sm">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="image-preview-grid mt-md">
          {images.map((image, index) => (
            <div key={index} className="image-preview-item">
              <img src={image.url} alt={`Upload ${index + 1}`} className="preview-image" />
              <button
                type="button"
                className="btn-remove-image"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
                title="Remove image"
              >
                ✕
              </button>
              <div className="image-info">
                <span className="image-name">{image.file.name}</span>
                <span className="image-size">
                  {(image.file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
