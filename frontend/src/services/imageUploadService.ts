import { supabase } from '../lib/supabase';

export interface UploadImageResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an image to Supabase storage
 * @param file - The image file to upload
 * @param userId - The user ID (for organizing files)
 * @param folder - Optional folder name (e.g., 'chat', 'generation')
 * @returns Upload result with URL and path
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: string = 'chat'
): Promise<UploadImageResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        url: '',
        path: '',
        error: 'File must be an image',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        url: '',
        path: '',
        error: 'Image size must be less than 5MB',
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
      .from('chat-images')
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
 * Upload multiple images
 * @param files - Array of image files
 * @param userId - The user ID
 * @param folder - Optional folder name
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  userId: string,
  folder: string = 'chat'
): Promise<UploadImageResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file, userId, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from storage
 * @param path - The storage path of the image
 * @returns Success status
 */
export async function deleteImage(path: string): Promise<{ success: boolean; error?: string }> {
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
 * Get image URL from storage path
 * @param path - The storage path
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB',
    };
  }

  // Check file extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: 'Allowed formats: JPG, PNG, GIF, WebP',
    };
  }

  return { valid: true };
}
