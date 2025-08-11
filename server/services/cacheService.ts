import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
  expiresAt?: number;
}

export interface EmbeddingCacheEntry {
  fileId: string;
  embedding: number[];
  contentHash: string;
  lastModified: string;
  createdAt: number;
}

export class CacheService {
  private cacheDir: string;
  private embeddingCacheFile: string;
  private maxCacheAge: number; // in milliseconds

  constructor(cacheDir: string = '.cache', maxCacheAge: number = 24 * 60 * 60 * 1000) {
    this.cacheDir = path.resolve(cacheDir);
    this.embeddingCacheFile = path.join(this.cacheDir, 'embeddings.json');
    this.maxCacheAge = maxCacheAge;
  }

  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log(`📁 Cache directory initialized: ${this.cacheDir}`);
    } catch (error) {
      console.error('Failed to initialize cache directory:', error);
      throw error;
    }
  }

  /**
   * Generate content hash for cache key
   */
  generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Load embedding cache from disk
   */
  async loadEmbeddingCache(): Promise<Map<string, EmbeddingCacheEntry>> {
    try {
      const cacheData = await fs.readFile(this.embeddingCacheFile, 'utf-8');
      const entries: EmbeddingCacheEntry[] = JSON.parse(cacheData);
      
      const cache = new Map<string, EmbeddingCacheEntry>();
      const now = Date.now();
      
      // Filter out expired entries
      for (const entry of entries) {
        if (now - entry.createdAt < this.maxCacheAge) {
          cache.set(entry.fileId, entry);
        }
      }
      
      console.log(`📋 Loaded ${cache.size} embedding cache entries`);
      return cache;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('📋 No existing embedding cache found, starting fresh');
        return new Map();
      }
      console.error('Failed to load embedding cache:', error);
      return new Map();
    }
  }

  /**
   * Save embedding cache to disk
   */
  async saveEmbeddingCache(cache: Map<string, EmbeddingCacheEntry>): Promise<void> {
    try {
      await this.initialize();
      
      const entries = Array.from(cache.values());
      await fs.writeFile(this.embeddingCacheFile, JSON.stringify(entries, null, 2));
      
      console.log(`💾 Saved ${entries.length} embedding cache entries`);
    } catch (error) {
      console.error('Failed to save embedding cache:', error);
      throw error;
    }
  }

  /**
   * Check if file content has changed since last cache
   */
  isContentChanged(fileId: string, content: string, lastModified: string, cache: Map<string, EmbeddingCacheEntry>): boolean {
    const cached = cache.get(fileId);
    if (!cached) return true;
    
    const currentHash = this.generateContentHash(content);
    return cached.contentHash !== currentHash || cached.lastModified !== lastModified;
  }

  /**
   * Get cached embedding if valid
   */
  getCachedEmbedding(fileId: string, content: string, lastModified: string, cache: Map<string, EmbeddingCacheEntry>): number[] | null {
    if (this.isContentChanged(fileId, content, lastModified, cache)) {
      return null;
    }
    
    const cached = cache.get(fileId);
    return cached ? cached.embedding : null;
  }

  /**
   * Add embedding to cache
   */
  addToCache(
    fileId: string, 
    embedding: number[], 
    content: string, 
    lastModified: string, 
    cache: Map<string, EmbeddingCacheEntry>
  ): void {
    const entry: EmbeddingCacheEntry = {
      fileId,
      embedding,
      contentHash: this.generateContentHash(content),
      lastModified,
      createdAt: Date.now()
    };
    
    cache.set(fileId, entry);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries(cache: Map<string, EmbeddingCacheEntry>): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [fileId, entry] of cache.entries()) {
      if (now - entry.createdAt > this.maxCacheAge) {
        cache.delete(fileId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache entries`);
    }
    
    return removedCount;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(cache: Map<string, EmbeddingCacheEntry>): {
    totalEntries: number;
    cacheSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(cache.values());
    const timestamps = entries.map(e => e.createdAt);
    
    return {
      totalEntries: cache.size,
      cacheSize: JSON.stringify(entries).length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      await fs.unlink(this.embeddingCacheFile);
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Failed to clear cache:', error);
        throw error;
      }
    }
  }

  /**
   * Optimize cache by removing least recently used entries if cache is too large
   */
  optimizeCache(cache: Map<string, EmbeddingCacheEntry>, maxEntries: number = 1000): number {
    if (cache.size <= maxEntries) return 0;
    
    // Sort by creation time and remove oldest entries
    const entries = Array.from(cache.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = entries.slice(0, cache.size - maxEntries);
    
    for (const [fileId] of toRemove) {
      cache.delete(fileId);
    }
    
    console.log(`🔧 Optimized cache: removed ${toRemove.length} oldest entries`);
    return toRemove.length;
  }

  /**
   * Batch update cache with multiple entries
   */
  batchUpdateCache(
    updates: Array<{
      fileId: string;
      embedding: number[];
      content: string;
      lastModified: string;
    }>,
    cache: Map<string, EmbeddingCacheEntry>
  ): void {
    for (const update of updates) {
      this.addToCache(update.fileId, update.embedding, update.content, update.lastModified, cache);
    }
    
    console.log(`📦 Batch updated ${updates.length} cache entries`);
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export utility functions for token optimization
export function optimizeContextForTokens(
  contextFiles: any[], 
  maxTokens: number = 4000,
  estimatedTokensPerChar: number = 0.25
): any[] {
  let totalTokens = 0;
  const optimizedFiles = [];
  
  // Sort by similarity score (highest first)
  const sortedFiles = [...contextFiles].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  
  for (const file of sortedFiles) {
    const contentLength = file.content?.length || file.preview?.length || 0;
    const estimatedTokens = contentLength * estimatedTokensPerChar;
    
    if (totalTokens + estimatedTokens <= maxTokens) {
      optimizedFiles.push(file);
      totalTokens += estimatedTokens;
    } else {
      // Try to include a truncated version
      const remainingTokens = maxTokens - totalTokens;
      const maxChars = Math.floor(remainingTokens / estimatedTokensPerChar);
      
      if (maxChars > 100) { // Only include if we can fit at least 100 characters
        const truncatedFile = {
          ...file,
          content: file.content ? file.content.substring(0, maxChars) + '...' : file.preview,
          truncated: true
        };
        optimizedFiles.push(truncatedFile);
      }
      break;
    }
  }
  
  return optimizedFiles;
}
