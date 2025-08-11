import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
import { SemanticSearchResult, generateEmbedding } from './embeddingService';

dotenv.config();

// ChromaDB configuration
const CHROMADB_HOST = process.env.CHROMADB_HOST || 'localhost';
const CHROMADB_PORT = parseInt(process.env.CHROMADB_PORT || '8000');
const COLLECTION_NAME = process.env.CHROMADB_COLLECTION_NAME || 'code_notes_embeddings';

export interface VectorDocument {
  id: string;
  document: string; // Text content for embedding
  metadata: {
    userId: string;
    filePath: string;
    notebook: string;
    preview: string;
    fileType: string;
    lastModified: string;
    content?: string;
  };
}

// Custom embedding function that uses our local Gemini embedding service
class LocalEmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      try {
        const result = await generateEmbedding(text);
        if (result.success && result.embedding.length > 0) {
          console.log(`✅ Generated embedding with ${result.embedding.length} dimensions`);
          embeddings.push(result.embedding);
        } else {
          console.error('Failed to generate embedding for text:', result.error);
          // Return a zero vector as fallback - use 768 for Gemini
          embeddings.push(new Array(768).fill(0));
        }
      } catch (error) {
        console.error('Error generating embedding:', error);
        // Return a zero vector as fallback - use 768 for Gemini
        embeddings.push(new Array(768).fill(0));
      }
    }

    return embeddings;
  }
}

export interface SearchQuery {
  queryText: string; // Text query for embedding
  userId: string;
  nResults?: number;
  threshold?: number;
  fileTypes?: string[];
  notebooks?: string[];
}

export interface SearchResult {
  id: string;
  distance: number;
  metadata: VectorDocument['metadata'];
}

export class VectorDbError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'VectorDbError';
  }
}

class VectorDbService {
  private client: ChromaClient | null = null;
  private collection: any | null = null;
  private embeddingFunction: any | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private lastConnectionAttempt = 0;
  private connectionRetryDelay = 5000; // 5 seconds
  private maxRetries = 3;

  /**
   * Initialize ChromaDB client and collection with retry logic
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Internal initialization method with retry logic
   */
  private async _doInitialize(): Promise<void> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting to connect to ChromaDB (attempt ${attempt}/${this.maxRetries})...`);

        // Initialize ChromaDB client
        this.client = new ChromaClient({
          host: CHROMADB_HOST,
          port: CHROMADB_PORT
        });

        // ChromaDB will use default embedding function (all-MiniLM-L6-v2) automatically

        // Test connection with a simple heartbeat
        await this._testConnection();

        // Create local embedding function using Gemini
        const embeddingFunction = new LocalEmbeddingFunction();

        // Try to get existing collection first
        try {
          this.collection = await this.client.getCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embeddingFunction
          });
          console.log(`✅ Connected to existing ChromaDB collection: ${COLLECTION_NAME}`);

          // Check if the collection has the right dimensions by testing with a sample embedding
          try {
            const testResult = await generateEmbedding("test");
            if (testResult.success) {
              console.log(`🔍 Testing collection with ${testResult.embedding.length}-dimensional embedding`);
              // Try a small upsert to test compatibility
              await this.collection.upsert({
                ids: ['dimension-test'],
                documents: ['test'],
                metadatas: [{ test: true }]
              });
              console.log(`✅ Collection is compatible with ${testResult.embedding.length}-dimensional embeddings`);

              // Clean up test document
              try {
                await this.collection.delete({ ids: ['dimension-test'] });
              } catch (e) {
                // Ignore cleanup errors
              }
            }
          } catch (dimensionError: any) {
            if (dimensionError.message?.includes('dimension')) {
              console.log(`⚠️ Dimension mismatch detected. Recreating collection...`);
              // Delete the existing collection
              await this.client.deleteCollection({ name: COLLECTION_NAME });
              console.log(`🗑️ Deleted incompatible collection: ${COLLECTION_NAME}`);
              throw new Error('Dimension mismatch - need to recreate');
            } else {
              throw dimensionError;
            }
          }
        } catch (error: any) {
          // Collection doesn't exist or has dimension mismatch, create it
          console.log(`📝 Creating new ChromaDB collection: ${COLLECTION_NAME}`);
          this.collection = await this.client.createCollection({
            name: COLLECTION_NAME,
            embeddingFunction: embeddingFunction,
            metadata: {
              description: 'Code Notes Buddy semantic search embeddings with Gemini text-embedding-004',
              created_at: new Date().toISOString(),
              version: '1.0.0',
              embedding_model: 'gemini-text-embedding-004'
            }
          });
          console.log(`✅ Created new ChromaDB collection: ${COLLECTION_NAME} with Gemini embeddings`);
        }

        this.isInitialized = true;
        this.lastConnectionAttempt = Date.now();
        console.log(`🎉 ChromaDB initialization successful on attempt ${attempt}`);
        return;

      } catch (error: any) {
        lastError = error;
        this.isInitialized = false;
        this.client = null;
        this.collection = null;

        console.warn(`⚠️ ChromaDB connection attempt ${attempt} failed:`, error.message);

        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.connectionRetryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.connectionRetryDelay));
        }
      }
    }

    // All attempts failed
    const errorMessage = `Failed to initialize ChromaDB after ${this.maxRetries} attempts`;
    console.error(`❌ ${errorMessage}. Last error:`, lastError);
    throw new VectorDbError(errorMessage, lastError);
  }

  /**
   * Test ChromaDB connection
   */
  private async _testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    try {
      // Test connection by trying to list collections (works with both v1 and v2)
      await this.client.listCollections();
      console.log(`🔗 ChromaDB connection test successful`);
    } catch (error: any) {
      throw new Error(`ChromaDB connection test failed: ${error.message}`);
    }
  }

  /**
   * Ensure the service is initialized with connection validation
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    } else {
      // Validate existing connection periodically
      const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
      if (timeSinceLastAttempt > 300000) { // 5 minutes
        try {
          await this._testConnection();
          this.lastConnectionAttempt = Date.now();
        } catch (error) {
          console.warn('ChromaDB connection validation failed, reinitializing...', error);
          this.isInitialized = false;
          await this.initialize();
        }
      }
    }
  }

  /**
   * Add or update documents in the vector database with batch processing
   * @param documents - Array of documents to add/update
   */
  async upsertDocuments(documents: VectorDocument[]): Promise<void> {
    if (!documents || documents.length === 0) {
      console.log('No documents to upsert');
      return;
    }

    await this.ensureInitialized();

    if (!this.collection) {
      throw new VectorDbError('Collection not initialized');
    }

    try {
      // Process in batches to avoid overwhelming ChromaDB
      const batchSize = 100;
      let totalUpserted = 0;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        const ids = batch.map(doc => doc.id);
        const documentTexts = batch.map(doc => doc.document);
        const metadatas = batch.map(doc => doc.metadata);

        // Validate documents
        for (let j = 0; j < documentTexts.length; j++) {
          if (!documentTexts[j] || documentTexts[j].trim().length === 0) {
            throw new VectorDbError(`Invalid document for ${ids[j]}: empty or null`);
          }
        }

        await this.collection.upsert({
          ids,
          documents: documentTexts,
          metadatas
        });

        totalUpserted += batch.length;
        console.log(`📦 Upserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} documents`);

        // Small delay between batches to be gentle on ChromaDB
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Successfully upserted ${totalUpserted} documents to ChromaDB`);
    } catch (error: any) {
      console.error('Failed to upsert documents to ChromaDB:', error);

      // Check if it's a connection error and reset initialization
      if (error.message?.includes('connection') || error.message?.includes('fetch')) {
        this.isInitialized = false;
      }

      throw new VectorDbError('Failed to upsert documents', error);
    }
  }

  /**
   * Search for similar documents with enhanced error handling
   * @param query - Search query parameters
   * @returns Array of search results
   */
  async searchSimilar(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.queryText || query.queryText.trim().length === 0) {
      throw new VectorDbError('Invalid query text: empty or null');
    }

    if (!query.userId) {
      throw new VectorDbError('User ID is required for search');
    }

    await this.ensureInitialized();

    if (!this.collection) {
      throw new VectorDbError('Collection not initialized');
    }

    try {
      const nResults = Math.min(query.nResults || 5, 50); // Cap at 50 results
      const threshold = Math.max(0, Math.min(query.threshold || 0.7, 1)); // Ensure valid threshold

      // Build where clause for filtering (ChromaDB syntax)
      // Temporarily remove userId filter to test if documents exist
      const whereClause: any = {};

      // TODO: Add userId filtering once we confirm documents exist
      // userId: query.userId

      // TODO: Add fileType and notebook filtering once basic search works
      // if (query.fileTypes && query.fileTypes.length > 0) {
      //   whereClause.fileType = { $in: query.fileTypes };
      // }

      // if (query.notebooks && query.notebooks.length > 0) {
      //   whereClause.notebook = { $in: query.notebooks };
      // }

      console.log(`🔍 Searching ChromaDB with query text: "${query.queryText.substring(0, 50)}...", threshold: ${threshold}`);

      // Query without where clause for now to test basic functionality
      const results = await this.collection.query({
        queryTexts: [query.queryText],
        nResults
        // where: whereClause // Temporarily removed due to ChromaDB where clause issues
      });

      if (!results.ids || !results.distances || !results.metadatas) {
        console.log('No results returned from ChromaDB query');
        return [];
      }

      if (results.ids.length === 0 || results.ids[0].length === 0) {
        console.log('Empty results from ChromaDB query');
        return [];
      }

      const searchResults: SearchResult[] = [];

      for (let i = 0; i < results.ids[0].length; i++) {
        const distance = results.distances[0][i];
        const similarity = 1 - distance; // Convert distance to similarity

        if (similarity >= threshold) {
          searchResults.push({
            id: results.ids[0][i],
            distance,
            metadata: results.metadatas[0][i] as VectorDocument['metadata']
          });
        }
      }

      console.log(`✅ ChromaDB search completed: ${searchResults.length}/${results.ids[0].length} results above threshold ${threshold}`);
      return searchResults;
    } catch (error: any) {
      console.error('Failed to search documents in ChromaDB:', error);

      // Check if it's a connection error and reset initialization
      if (error.message?.includes('connection') || error.message?.includes('fetch')) {
        this.isInitialized = false;
      }

      throw new VectorDbError('Failed to search documents', error);
    }
  }

  /**
   * Delete documents by IDs
   * @param ids - Array of document IDs to delete
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.ensureInitialized();

    if (!this.collection) {
      throw new VectorDbError('Collection not initialized');
    }

    try {
      await this.collection.delete({
        ids
      });

      console.log(`🗑️ Deleted ${ids.length} documents from vector database`);
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw new VectorDbError('Failed to delete documents', error);
    }
  }

  /**
   * Delete all documents for a specific user
   * @param userId - User ID to delete documents for
   */
  async deleteUserDocuments(userId: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.collection) {
      throw new VectorDbError('Collection not initialized');
    }

    try {
      await this.collection.delete({
        where: { userId }
      });

      console.log(`🗑️ Deleted all documents for user: ${userId}`);
    } catch (error) {
      console.error('Failed to delete user documents:', error);
      throw new VectorDbError('Failed to delete user documents', error);
    }
  }

  /**
   * Get collection statistics
   * @returns Collection count and metadata
   */
  async getCollectionStats(): Promise<{ count: number; metadata?: any }> {
    await this.ensureInitialized();

    if (!this.collection) {
      throw new VectorDbError('Collection not initialized');
    }

    try {
      const count = await this.collection.count();
      const metadata = this.collection.metadata;

      return { count, metadata };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw new VectorDbError('Failed to get collection stats', error);
    }
  }

  /**
   * Comprehensive health check for ChromaDB
   * @returns boolean indicating if the service is operational
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Quick connection test first
      await this._testConnection();

      // Try to initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.collection) {
        console.warn('ChromaDB health check failed: collection not available');
        return false;
      }

      // Try to get collection count as a functional test
      const count = await this.collection.count();
      console.log(`🏥 ChromaDB health check passed: ${count} documents in collection`);
      return true;
    } catch (error: any) {
      console.warn('ChromaDB health check failed:', error.message);

      // Reset initialization state on health check failure
      this.isInitialized = false;
      this.client = null;
      this.collection = null;

      return false;
    }
  }

  /**
   * Convert search results to semantic search results format
   * @param searchResults - Raw search results from ChromaDB
   * @returns Formatted semantic search results
   */
  convertToSemanticResults(searchResults: SearchResult[]): SemanticSearchResult[] {
    return searchResults.map(result => ({
      fileId: result.id,
      filePath: result.metadata.filePath,
      notebook: result.metadata.notebook,
      fileType: result.metadata.fileType,
      preview: result.metadata.preview,
      similarity: 1 - result.distance, // Convert distance back to similarity
      content: result.metadata.content
    }));
  }

  /**
   * Get detailed connection information
   */
  getConnectionInfo(): { host: string; port: number; collection: string; isInitialized: boolean } {
    return {
      host: CHROMADB_HOST,
      port: CHROMADB_PORT,
      collection: COLLECTION_NAME,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Force reconnection to ChromaDB
   */
  async reconnect(): Promise<void> {
    console.log('🔄 Forcing ChromaDB reconnection...');
    this.isInitialized = false;
    this.client = null;
    this.collection = null;
    this.initializationPromise = null;
    await this.initialize();
  }

  /**
   * Get collection metadata and statistics
   */
  async getDetailedStats(): Promise<{
    count: number;
    metadata: any;
    connectionInfo: any;
    lastConnectionAttempt: Date;
    isHealthy: boolean;
  }> {
    try {
      const stats = await this.getCollectionStats();
      const healthy = await this.healthCheck();

      return {
        count: stats.count,
        metadata: stats.metadata,
        connectionInfo: this.getConnectionInfo(),
        lastConnectionAttempt: new Date(this.lastConnectionAttempt),
        isHealthy: healthy
      };
    } catch (error: any) {
      throw new VectorDbError('Failed to get detailed stats', error);
    }
  }
}

// Export singleton instance
export const vectorDbService = new VectorDbService();

// Export utility functions
export { VectorDbService };
