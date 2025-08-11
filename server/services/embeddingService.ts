import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { cacheService, EmbeddingCacheEntry } from './cacheService';

dotenv.config();

// Query embedding cache for faster repeated searches
interface QueryCacheEntry {
  query: string;
  embedding: number[];
  timestamp: number;
}

// Simple in-memory cache for query embeddings (10 minute TTL)
const queryEmbeddingCache = new Map<string, QueryCacheEntry>();
const QUERY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Initialize the Gemini API client for embeddings
const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Get the embedding model
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export interface EmbeddingResult {
  embedding: number[];
  success: boolean;
  error?: string;
}

export interface FileEmbeddingData {
  fileId: string;
  filePath: string;
  notebook: string;
  content: string;
  fileType: string;
  preview: string;
  lastModified: Date;
}

export interface SemanticSearchResult {
  fileId: string;
  filePath: string;
  notebook: string;
  fileType: string;
  preview: string;
  similarity: number;
  content?: string;
}

export class EmbeddingServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'EmbeddingServiceError';
  }
}

/**
 * Get cached query embedding if available and not expired
 */
function getCachedQueryEmbedding(query: string): number[] | null {
  const cacheKey = query.toLowerCase().trim();
  const cached = queryEmbeddingCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > QUERY_CACHE_TTL) {
    queryEmbeddingCache.delete(cacheKey);
    return null;
  }

  console.log(`⚡ Using cached embedding for query: "${query}"`);
  return cached.embedding;
}

/**
 * Cache query embedding for future use
 */
function cacheQueryEmbedding(query: string, embedding: number[]): void {
  const cacheKey = query.toLowerCase().trim();
  queryEmbeddingCache.set(cacheKey, {
    query: cacheKey,
    embedding,
    timestamp: Date.now()
  });

  console.log(`💾 Cached embedding for query: "${query}"`);

  // Clean up expired entries periodically
  if (queryEmbeddingCache.size > 100) {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, entry] of queryEmbeddingCache.entries()) {
      if (now - entry.timestamp > QUERY_CACHE_TTL) {
        queryEmbeddingCache.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired query cache entries`);
    }
  }
}

/**
 * Generate embedding for search queries with caching
 * @param query - The search query to generate embedding for
 * @returns Promise with embedding result
 */
export async function generateSearchQueryEmbedding(query: string): Promise<EmbeddingResult> {
  try {
    if (!apiKey) {
      throw new EmbeddingServiceError('API key is not configured');
    }

    if (!query || query.trim().length === 0) {
      throw new EmbeddingServiceError('Query cannot be empty');
    }

    // Check cache first
    const cachedEmbedding = getCachedQueryEmbedding(query);
    if (cachedEmbedding) {
      return {
        embedding: cachedEmbedding,
        success: true
      };
    }

    // Generate new embedding
    const result = await generateEmbedding(query);

    // Cache the result if successful
    if (result.success && result.embedding.length > 0) {
      cacheQueryEmbedding(query, result.embedding);
    }

    return result;

  } catch (error: any) {
    console.error('Search query embedding generation error:', error);
    return {
      embedding: [],
      success: false,
      error: error.message || 'Failed to generate search query embedding'
    };
  }
}

/**
 * Generate embedding for a given text using Gemini's embedding model
 * @param text - The text to generate embedding for
 * @returns Promise with embedding result
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    if (!apiKey) {
      throw new EmbeddingServiceError('API key is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new EmbeddingServiceError('Text cannot be empty');
    }

    // Truncate text to first 2000 characters for embedding
    const truncatedText = text.substring(0, 2000);

    // Generate embedding using Gemini
    const result = await embeddingModel.embedContent(truncatedText);
    const embedding = result.embedding;

    if (!embedding || !embedding.values || embedding.values.length === 0) {
      throw new EmbeddingServiceError('Empty embedding response from Gemini API');
    }

    return {
      embedding: embedding.values,
      success: true
    };

  } catch (error: any) {
    console.error('Embedding generation error:', error);

    let errorMessage = 'Failed to generate embedding';
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded';
    } else if (error instanceof EmbeddingServiceError) {
      errorMessage = error.message;
    }

    return {
      embedding: [],
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Generate embeddings for multiple files in batch with caching
 * @param files - Array of file data to generate embeddings for
 * @param useCache - Whether to use embedding cache
 * @returns Promise with array of embedding results
 */
export async function generateBatchEmbeddings(
  files: FileEmbeddingData[],
  useCache: boolean = true
): Promise<Array<EmbeddingResult & { fileId: string }>> {
  const results: Array<EmbeddingResult & { fileId: string }> = [];

  // Load cache if enabled
  let cache = new Map<string, EmbeddingCacheEntry>();
  if (useCache) {
    try {
      cache = await cacheService.loadEmbeddingCache();
      console.log(`📋 Loaded embedding cache with ${cache.size} entries`);
    } catch (error) {
      console.warn('Failed to load cache, proceeding without cache:', error);
    }
  }

  const filesToProcess: FileEmbeddingData[] = [];
  let cacheHits = 0;

  // Check cache for existing embeddings
  for (const file of files) {
    if (useCache) {
      const cachedEmbedding = cacheService.getCachedEmbedding(
        file.fileId,
        file.content,
        file.lastModified.toISOString(),
        cache
      );

      if (cachedEmbedding) {
        results.push({
          embedding: cachedEmbedding,
          success: true,
          fileId: file.fileId
        });
        cacheHits++;
        continue;
      }
    }

    filesToProcess.push(file);
  }

  console.log(`🎯 Cache hits: ${cacheHits}/${files.length}, processing ${filesToProcess.length} new files`);

  // Process files that need new embeddings in batches
  const batchSize = 5;
  const newCacheEntries: Array<{
    fileId: string;
    embedding: number[];
    content: string;
    lastModified: string;
  }> = [];

  for (let i = 0; i < filesToProcess.length; i += batchSize) {
    const batch = filesToProcess.slice(i, i + batchSize);

    const batchPromises = batch.map(async (file) => {
      const embeddingResult = await generateEmbedding(file.content);

      // Add to cache if successful
      if (embeddingResult.success && useCache) {
        newCacheEntries.push({
          fileId: file.fileId,
          embedding: embeddingResult.embedding,
          content: file.content,
          lastModified: file.lastModified.toISOString()
        });
      }

      return {
        ...embeddingResult,
        fileId: file.fileId
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to respect rate limits
    if (i + batchSize < filesToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Update cache with new entries
  if (useCache && newCacheEntries.length > 0) {
    try {
      cacheService.batchUpdateCache(newCacheEntries, cache);

      // Clean up expired entries and optimize cache size
      cacheService.cleanupExpiredEntries(cache);
      cacheService.optimizeCache(cache, 1000);

      await cacheService.saveEmbeddingCache(cache);
      console.log(`💾 Updated cache with ${newCacheEntries.length} new embeddings`);
    } catch (error) {
      console.warn('Failed to update cache:', error);
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two vectors
 * @param vectorA - First vector
 * @param vectorB - Second vector
 * @returns Cosine similarity score (0-1)
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Prepare file content for embedding by extracting meaningful text
 * @param content - Raw file content
 * @param fileType - File extension/type
 * @returns Processed content suitable for embedding
 */
export function prepareContentForEmbedding(content: string, fileType: string): string {
  if (!content) return '';

  // Remove excessive whitespace and normalize line endings
  let processedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // For code files, preserve structure but remove excessive comments
  if (['py', 'js', 'cpp', 'json'].includes(fileType)) {
    // Remove single-line comments but keep docstrings and important comments
    processedContent = processedContent.replace(/^\s*\/\/.*$/gm, '');
    processedContent = processedContent.replace(/^\s*#(?!\s*(TODO|FIXME|NOTE|HACK)).*$/gm, '');
  }

  // Normalize whitespace
  processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  processedContent = processedContent.trim();

  return processedContent;
}

/**
 * Create a preview text for display purposes
 * @param content - Full file content
 * @param maxLength - Maximum length of preview (default: 200)
 * @returns Preview text
 */
export function createPreview(content: string, maxLength: number = 200): string {
  if (!content) return '';

  const cleanContent = content.replace(/\s+/g, ' ').trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // Try to break at word boundary
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Check if the embedding service is properly configured
 * @returns boolean indicating if the service is ready to use
 */
export function isEmbeddingServiceConfigured(): boolean {
  return !!apiKey;
}
