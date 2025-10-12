/**
 * Prompt Cache - Lazy load and cache system prompts
 * Prevents reloading large prompts on every agent initialization
 */

interface CachedPrompt {
  content: string;
  timestamp: number;
  size: number;
}

class PromptCache {
  private cache = new Map<string, CachedPrompt>();
  private hits = 0;
  private misses = 0;

  /**
   * Get or load a prompt with caching
   */
  getOrLoad(key: string, loader: () => string): string {
    const cached = this.cache.get(key);
    
    if (cached) {
      this.hits++;
      return cached.content;
    }

    this.misses++;
    const content = loader();
    
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      size: content.length
    });

    return content;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  }

  /**
   * Clear cache for a specific key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Preload common prompts
   */
  async preload(prompts: Array<{ key: string; loader: () => string }>): Promise<void> {
    console.log(`[PromptCache] Preloading ${prompts.length} prompts...`);
    
    for (const { key, loader } of prompts) {
      this.getOrLoad(key, loader);
    }
    
    const stats = this.getStats();
    console.log(`[PromptCache] Preloaded ${stats.entries} prompts (${stats.totalSizeKB} KB)`);
  }
}

// Singleton instance
let promptCacheInstance: PromptCache | null = null;

export function getPromptCache(): PromptCache {
  if (!promptCacheInstance) {
    promptCacheInstance = new PromptCache();
  }
  return promptCacheInstance;
}
