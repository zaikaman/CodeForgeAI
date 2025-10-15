/**
 * File processing utilities for handling file uploads and downloads
 * Supports images and documents for GPT-5-nano multimodal processing
 */

/**
 * Validate if a buffer contains a valid image
 */
export function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  
  return (
    // PNG
    (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
    // JPEG
    (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ||
    // GIF
    (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||
    // WebP (check for RIFF...WEBP)
    (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
     buffer.length >= 12 &&
     buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) ||
    // BMP
    (buffer[0] === 0x42 && buffer[1] === 0x4D)
  );
}

/**
 * Validate if a buffer contains a valid PDF
 */
export function isValidPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
}

/**
 * Get file format description for logging
 */
export function getFileFormatInfo(buffer: Buffer, contentType: string): string {
  if (contentType.startsWith('image/')) {
    if (!isValidImageBuffer(buffer)) {
      return 'Invalid image format';
    }
    
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'PNG';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'JPEG';
    if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'GIF';
    if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'WebP';
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) return 'BMP';
    return 'Image';
  }
  
  if (contentType === 'application/pdf') {
    return isValidPdfBuffer(buffer) ? 'PDF' : 'Invalid PDF';
  }
  
  return contentType.split('/').pop()?.toUpperCase() || 'Unknown';
}

/**
 * Fetch a file from URL and convert to base64 for LLM processing
 * Includes validation for image formats
 */
export async function fetchFileAsBase64(
  url: string,
  context: string = 'FileProcessor'
): Promise<{
  inline_data: {
    mime_type: string;
    data: string;
  };
} | null> {
  try {
    console.log(`[${context}] Fetching file from: ${url}`);
    const response = await globalThis.fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const formatInfo = getFileFormatInfo(buffer, contentType);
    console.log(`[${context}] Successfully fetched: ${url.split('/').pop()} (${formatInfo}, ${buffer.length} bytes)`);
    
    // For images, validate the data is actually a valid image
    if (contentType.startsWith('image/')) {
      if (!isValidImageBuffer(buffer)) {
        throw new Error(`Invalid image format - file does not contain valid ${contentType} data`);
      }
    }
    
    // For PDFs, validate format
    if (contentType === 'application/pdf') {
      if (!isValidPdfBuffer(buffer)) {
        throw new Error(`Invalid PDF format - file does not contain valid PDF data`);
      }
    }
    
    return {
      inline_data: {
        mime_type: contentType,
        data: base64
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Failed to fetch/process file from ${url}:`, errorMsg);
    return null;
  }
}

/**
 * Fetch multiple files and convert to base64
 * Returns only successfully fetched files
 */
export async function fetchMultipleFilesAsBase64(
  urls: string[],
  context: string = 'FileProcessor'
): Promise<Array<{
  inline_data: {
    mime_type: string;
    data: string;
  };
}>> {
  const results = await Promise.all(
    urls.map(url => fetchFileAsBase64(url, context))
  );
  
  const validFiles = results.filter(file => file !== null) as Array<{
    inline_data: {
      mime_type: string;
      data: string;
    };
  }>;
  
  if (validFiles.length === 0 && urls.length > 0) {
    console.warn(`[${context}] ⚠️ WARNING: No valid files could be loaded from ${urls.length} URLs`);
  } else if (validFiles.length < urls.length) {
    console.warn(`[${context}] ⚠️ WARNING: Only ${validFiles.length}/${urls.length} files loaded successfully`);
  } else {
    console.log(`[${context}] Successfully loaded ${validFiles.length} file(s)`);
  }
  
  return validFiles;
}
