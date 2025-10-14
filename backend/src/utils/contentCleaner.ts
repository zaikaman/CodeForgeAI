/**
 * Content Cleaner Utility
 * Post-process content from various sources (AI, GitHub API, etc.)
 * to ensure proper formatting and escaped characters
 */

export interface FileContent {
  path: string;
  content: string;
}

/**
 * Unescape literal escape sequences in string content
 * Common issue: AI or JSON responses may have \\n instead of actual newlines
 * 
 * @param content - String content with potential escaped characters
 * @returns Cleaned content with actual newlines, tabs, etc.
 */
export function unescapeContent(content: string): string {
  if (typeof content !== 'string') {
    return content;
  }
  
  // Check if content has escaped characters
  if (!content.includes('\\n') && !content.includes('\\t') && !content.includes('\\"')) {
    return content; // No escaping needed
  }
  
  return content
    .replace(/\\n/g, '\n')      // Unescape newlines
    .replace(/\\t/g, '\t')      // Unescape tabs
    .replace(/\\r/g, '\r')      // Unescape carriage returns
    .replace(/\\"/g, '"')       // Unescape double quotes
    .replace(/\\'/g, "'")       // Unescape single quotes
    .replace(/\\\\/g, '\\');    // Unescape backslashes (do this LAST!)
}

/**
 * Clean file content array - unescape all files
 * 
 * @param files - Array of files with potentially escaped content
 * @returns Array of files with cleaned content
 */
export function cleanFiles(files: FileContent[]): FileContent[] {
  return files.map(file => ({
    path: file.path,
    content: unescapeContent(file.content)
  }));
}

/**
 * Normalize line endings to \n (LF) for consistency
 * 
 * @param content - String content with mixed line endings
 * @returns Content with normalized line endings
 */
export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Full content cleanup pipeline
 * - Unescape literal escape sequences
 * - Normalize line endings
 * - Trim trailing whitespace from each line (optional)
 * 
 * @param content - Raw content string
 * @param options - Cleanup options
 * @returns Fully cleaned content
 */
export function cleanContent(
  content: string,
  options: {
    trimLines?: boolean;
    normalizeLineEndings?: boolean;
  } = {}
): string {
  const {
    trimLines = false,
    normalizeLineEndings: shouldNormalize = true
  } = options;
  
  let cleaned = unescapeContent(content);
  
  if (shouldNormalize) {
    cleaned = normalizeLineEndings(cleaned);
  }
  
  if (trimLines) {
    cleaned = cleaned
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
  }
  
  return cleaned;
}

/**
 * Detect if content has escaped characters that need cleaning
 * 
 * @param content - String content to check
 * @returns True if content has escaped characters
 */
export function hasEscapedCharacters(content: string): boolean {
  if (typeof content !== 'string') {
    return false;
  }
  
  return content.includes('\\n') || 
         content.includes('\\t') || 
         content.includes('\\"') ||
         content.includes('\\r');
}
