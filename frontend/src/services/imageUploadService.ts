// Re-export everything from fileUploadService for backward compatibility
export * from './fileUploadService';

export interface UploadImageResult {
  url: string;
  path: string;
  error?: string;
}

// Keep old function names for backward compatibility
import {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileUrl,
  validateFile as validateFileNew,
} from './fileUploadService';

export const uploadImage = uploadFile;
export const uploadMultipleImages = uploadMultipleFiles;
export const deleteImage = deleteFile;
export const getImageUrl = getFileUrl;
export const validateImageFile = validateFileNew;
