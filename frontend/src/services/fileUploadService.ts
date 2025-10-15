import { supabase } from '../lib/supabase';

export interface UploadFileResult {
  url: string;
  path: string;
  error?: string;
  fileType?: string;
  fileName?: string;
}

/**
 * Supported file types for GPT-5-nano
 * Based on OpenAI's official documentation
 */
export const SUPPORTED_FILE_TYPES = {
  // Documents and text
  documents: ['.docx', '.html', '.md', '.pdf', '.tex', '.txt'],
  // Spreadsheets and data
  data: ['.csv', '.json', '.xml', '.xlsx'],
  // Presentations
  presentations: ['.pptx'],
  // Code and scripts
  code: ['.c', '.cpp', '.css', '.java', '.js', '.php', '.py', '.rb', '.ts', '.tsx', '.jsx', '.go', '.rs', '.swift'],
  // Images (multimodal support)
  images: ['.gif', '.jpg', '.jpeg', '.png', '.webp'],
  // Archives
  archives: ['.tar', '.zip'],
};

/**
 * Get all supported extensions as a flat array
 */
export const getAllSupportedExtensions = (): string[] => {
  return Object.values(SUPPORTED_FILE_TYPES).flat();
};

/**
 * Get MIME type accept string for file input
 */
export const getAcceptString = (): string => {
  const extensions = getAllSupportedExtensions();
  return extensions.join(',');
};

/**
 * Determine file category based on extension
 */
export const getFileCategory = (fileName: string): string => {
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
  
  for (const [category, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  
  return 'unknown';
};

/**
 * Get icon for file type
 */
export const getFileIcon = (fileName: string): string => {
  const category = getFileCategory(fileName);
  
  const icons: Record<string, string> = {
    documents: '📄',
    data: '📊',
    presentations: '📊',
    code: '💻',
    images: '🖼️',
    archives: '📦',
    unknown: '📎',
  };
  
  return icons[category] || icons.unknown;
};

/**
 * Check if file is an image (for preview purposes)
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
  return SUPPORTED_FILE_TYPES.images.includes(ext);
};

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param userId - The user ID (for organizing files)
 * @param folder - Optional folder name (e.g., 'chat', 'generation')
 * @returns Upload result with URL and path
 */
export async function uploadFile(
  file: File,
  userId: string,
  folder: string = 'chat'
): Promise<UploadFileResult> {
  try {
    // Validate file type
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        url: '',
        path: '',
        error: validation.error,
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('chat-images') // Keep bucket name for backward compatibility
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        path: '',
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      fileType: file.type,
      fileName: file.name,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple files
 * @param files - Array of files
 * @param userId - The user ID
 * @param folder - Optional folder name
 * @returns Array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  folder: string = 'chat'
): Promise<UploadFileResult[]> {
  const uploadPromises = files.map((file) => uploadFile(file, userId, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from storage
 * @param path - The storage path of the file
 * @returns Success status
 */
export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from('chat-images').remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get file URL from storage path
 * @param path - The storage path
 * @returns Public URL
 */
export function getFileUrl(path: string): string {
  const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Validate file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 20MB for documents, 10MB for images)
  const maxSize = isImageFile(file.name) ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxSize) {
    const maxSizeMB = isImageFile(file.name) ? 10 : 20;
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file extension
  const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const allExtensions = getAllSupportedExtensions();
  
  if (!allExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported: ${allExtensions.slice(0, 10).join(', ')}...`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Backward compatibility exports
export const uploadImage = uploadFile;
export const uploadMultipleImages = uploadMultipleFiles;
export const deleteImage = deleteFile;
export const getImageUrl = getFileUrl;
export const validateImageFile = validateFile;
export type UploadImageResult = UploadFileResult;
