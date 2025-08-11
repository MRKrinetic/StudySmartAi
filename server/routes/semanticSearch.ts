import express from 'express';
import { body, query, validationResult } from 'express-validator';
import File from '../models/File';
import Notebook from '../models/Notebook';
import {
  generateSearchQueryEmbedding,
  generateBatchEmbeddings,
  prepareContentForEmbedding,
  createPreview,
  FileEmbeddingData,
  SemanticSearchResult
} from '../services/embeddingService';
import { vectorDbService, VectorDocument, SearchQuery } from '../services/vectorDbService';

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors.array()
    });
  }
  next();
};

// POST /api/semantic/index-files - Index files for semantic search
router.post('/index-files',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('incremental').optional().isBoolean().withMessage('Incremental must be boolean'),
    body('fileTypes').optional().isArray().withMessage('File types must be an array'),
    body('notebooks').optional().isArray().withMessage('Notebooks must be an array')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId, incremental = false, fileTypes, notebooks } = req.body;

      console.log(`🔄 Starting semantic indexing for user: ${userId}`);
      console.log(`📊 Incremental: ${incremental}, FileTypes: ${fileTypes?.join(',') || 'all'}, Notebooks: ${notebooks?.join(',') || 'all'}`);

      // Build query filters
      const query: any = {};
      if (fileTypes && fileTypes.length > 0) {
        query.type = { $in: fileTypes };
      }
      if (notebooks && notebooks.length > 0) {
        // Get notebook IDs from names
        const notebookDocs = await Notebook.find({ name: { $in: notebooks } });
        const notebookIds = notebookDocs.map(nb => nb._id);
        query.notebookId = { $in: notebookIds };
      }

      // Fetch files to index
      const files = await File.find(query)
        .populate('notebookId', 'name')
        .sort({ updatedAt: -1 })
        .lean();

      if (files.length === 0) {
        return res.json({
          success: true,
          message: 'No files found to index',
          data: {
            totalFiles: 0,
            indexedFiles: 0,
            skippedFiles: 0,
            errors: []
          }
        });
      }

      // Prepare file data for embedding
      const fileEmbeddingData: FileEmbeddingData[] = files.map(file => ({
        fileId: file._id.toString(),
        filePath: `${(file.notebookId as any).name}/${file.name}`,
        notebook: (file.notebookId as any).name,
        content: prepareContentForEmbedding(file.content, file.type),
        fileType: file.type,
        preview: createPreview(file.content),
        lastModified: file.updatedAt
      }));

      // Prepare files for local embedding (ChromaDB will handle embedding generation)
      console.log(`📝 Preparing ${fileEmbeddingData.length} files for local embedding...`);

      // Prepare documents for vector database (using local embeddings)
      const vectorDocuments: VectorDocument[] = [];
      const errors: string[] = [];
      let indexedCount = 0;

      for (let i = 0; i < fileEmbeddingData.length; i++) {
        const fileData = fileEmbeddingData[i];

        try {
          vectorDocuments.push({
            id: fileData.fileId,
            document: fileData.content, // Use content directly for local embedding
            metadata: {
              userId,
              filePath: fileData.filePath,
              notebook: fileData.notebook,
              preview: fileData.preview,
              fileType: fileData.fileType,
              lastModified: fileData.lastModified.toISOString()
            }
          });
          indexedCount++;
        } catch (error: any) {
          errors.push(`Failed to prepare document for file ${fileData.filePath}: ${error.message}`);
        }
      }

      // Store embeddings in vector database
      if (vectorDocuments.length > 0) {
        console.log(`💾 Storing ${vectorDocuments.length} embeddings in ChromaDB...`);
        await vectorDbService.upsertDocuments(vectorDocuments);
      }

      const response = {
        success: true,
        message: `Successfully indexed ${indexedCount} files`,
        data: {
          totalFiles: files.length,
          indexedFiles: indexedCount,
          skippedFiles: files.length - indexedCount,
          errors
        }
      };

      console.log(`✅ Semantic indexing completed: ${indexedCount}/${files.length} files indexed`);
      res.json(response);

    } catch (error: any) {
      console.error('Semantic indexing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to index files for semantic search',
        details: error.message
      });
    }
  }
);

// POST /api/semantic/search - Perform semantic search
router.post('/search',
  [
    body('query').notEmpty().withMessage('Search query is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('maxResults').optional().isInt({ min: 1, max: 20 }).withMessage('Max results must be between 1 and 20'),
    body('threshold').optional().isFloat({ min: 0, max: 1 }).withMessage('Threshold must be between 0 and 1'),
    body('fileTypes').optional().isArray().withMessage('File types must be an array'),
    body('notebooks').optional().isArray().withMessage('Notebooks must be an array')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const {
        query: searchQuery,
        userId,
        maxResults = 3,
        threshold = 0.7,
        fileTypes,
        notebooks
      } = req.body;

      console.log(`🔍 Semantic search query: "${searchQuery}" for user: ${userId}`);

      // Query will be embedded locally by ChromaDB

      // Perform vector search
      const searchResults = await vectorDbService.searchSimilar({
        queryText: searchQuery,
        userId,
        nResults: maxResults,
        threshold,
        fileTypes,
        notebooks
      });

      // Convert to semantic search results format
      const semanticResults = vectorDbService.convertToSemanticResults(searchResults);

      // Fetch full content for top results if needed
      const resultsWithContent: SemanticSearchResult[] = [];
      for (const result of semanticResults) {
        try {
          const file = await File.findById(result.fileId).lean();
          if (file) {
            resultsWithContent.push({
              ...result,
              content: file.content
            });
          } else {
            resultsWithContent.push(result);
          }
        } catch (error) {
          console.warn(`Failed to fetch content for file ${result.fileId}:`, error);
          resultsWithContent.push(result);
        }
      }

      const response = {
        success: true,
        data: {
          query: searchQuery,
          results: resultsWithContent,
          totalResults: resultsWithContent.length,
          threshold,
          maxResults
        }
      };

      console.log(`✅ Semantic search completed: ${resultsWithContent.length} results found`);
      res.json(response);

    } catch (error: any) {
      console.error('Semantic search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to perform semantic search',
        details: error.message
      });
    }
  }
);

// GET /api/semantic/stats - Get semantic search statistics
router.get('/stats',
  [
    query('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.query;

      // Get vector database stats
      const dbStats = await vectorDbService.getCollectionStats();
      const isHealthy = await vectorDbService.healthCheck();

      // Get user-specific file count
      const userFileCount = await File.countDocuments({});

      const response = {
        success: true,
        data: {
          totalEmbeddings: dbStats.count,
          userFiles: userFileCount,
          collectionMetadata: dbStats.metadata,
          isHealthy: isHealthy,
          activeVectorDb: 'chromadb',
          vectorDbHealthy: isHealthy
        }
      };

      res.json(response);

    } catch (error: any) {
      console.error('Semantic stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get semantic search statistics',
        details: error.message
      });
    }
  }
);

// POST /api/semantic/chat - Chat with semantic search context
router.post('/chat',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('includeSemanticSearch').optional().isBoolean().withMessage('Include semantic search must be boolean'),
    body('maxContextFiles').optional().isInt({ min: 1, max: 10 }).withMessage('Max context files must be between 1 and 10'),
    body('searchThreshold').optional().isFloat({ min: 0, max: 1 }).withMessage('Search threshold must be between 0 and 1')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const {
        message,
        userId,
        includeSemanticSearch = true,
        maxContextFiles = 3,
        searchThreshold = 0.7
      } = req.body;

      console.log(`💬 Chat request from user ${userId}: "${message}"`);

      let contextFiles: SemanticSearchResult[] = [];
      let searchPerformed = false;

      // Perform semantic search if enabled
      if (includeSemanticSearch) {
        try {
          console.log(`🔍 Performing semantic search for context...`);

          // Search for relevant files using local embeddings
          const searchResults = await vectorDbService.searchSimilar({
            queryText: message,
            userId,
            nResults: maxContextFiles,
            threshold: searchThreshold
          });

          contextFiles = vectorDbService.convertToSemanticResults(searchResults);
          searchPerformed = true;

          // Fetch full content for context files
          for (let i = 0; i < contextFiles.length; i++) {
            try {
              const file = await File.findById(contextFiles[i].fileId).lean();
              if (file) {
                contextFiles[i].content = file.content;
              }
            } catch (error) {
              console.warn(`Failed to fetch content for context file ${contextFiles[i].fileId}:`, error);
            }
          }

          console.log(`📄 Found ${contextFiles.length} relevant files for context`);
        } catch (error) {
          console.warn('Semantic search failed, continuing without context:', error);
        }
      }

      const response = {
        success: true,
        data: {
          message,
          contextFiles,
          searchPerformed,
          totalContextFiles: contextFiles.length,
          searchThreshold,
          // Note: Actual Gemini response generation would be handled by the frontend
          // This endpoint provides the semantic search context for the chat
        }
      };

      console.log(`✅ Chat context prepared with ${contextFiles.length} relevant files`);
      res.json(response);

    } catch (error: any) {
      console.error('Semantic chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process chat request with semantic search',
        details: error.message
      });
    }
  }
);

// GET /api/semantic/vector-db-status - Get vector database status and information
router.get('/vector-db-status',
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('🔍 Vector DB status check requested');

      const isHealthy = await vectorDbService.healthCheck();
      console.log(`🔍 Vector DB health check result: ${isHealthy}`);

      let dbStats = { count: 0, metadata: null };
      try {
        dbStats = await vectorDbService.getCollectionStats();
        console.log(`🔍 Vector DB stats: ${dbStats.count} documents`);
      } catch (statsError: any) {
        console.warn('Failed to get vector DB stats:', statsError.message);
      }

      const response = {
        success: true,
        data: {
          activeService: 'chromadb',
          isHealthy: isHealthy,
          totalEmbeddings: dbStats.count,
          metadata: dbStats.metadata,
          chromaDbAvailable: true,
          recommendations: isHealthy ? [
            'ChromaDB is active and running optimally'
          ] : [
            'ChromaDB connection failed',
            'Check if ChromaDB is running: chroma run --host localhost --port 8000',
            'Ensure ChromaDB is accessible at the configured host and port'
          ]
        }
      };

      console.log('🔍 Sending vector DB status response:', {
        isHealthy,
        totalEmbeddings: dbStats.count
      });

      res.json(response);

    } catch (error: any) {
      console.error('Vector DB status error:', error);

      // Always return a proper JSON response, even on error
      const errorResponse = {
        success: false,
        error: 'Vector Database Error',
        message: 'Failed to get vector database status',
        data: {
          activeService: 'chromadb',
          isHealthy: false,
          totalEmbeddings: 0,
          metadata: null,
          chromaDbAvailable: false,
          recommendations: [
            'ChromaDB service is not responding',
            'Check if ChromaDB is running: chroma run --host localhost --port 8000',
            'Verify ChromaDB configuration and network connectivity'
          ]
        },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      };

      res.status(500).json(errorResponse);
    }
  }
);

// POST /api/semantic/refresh-vector-db - Refresh ChromaDB connection
router.post('/refresh-vector-db',
  async (req: express.Request, res: express.Response) => {
    try {
      await vectorDbService.reconnect();
      const isHealthy = await vectorDbService.healthCheck();

      const response = {
        success: true,
        message: 'ChromaDB connection refreshed',
        data: {
          service: 'ChromaDB',
          isHealthy
        }
      };

      console.log(`🔄 ChromaDB connection refreshed - healthy: ${isHealthy}`);
      res.json(response);

    } catch (error: any) {
      console.error('ChromaDB refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to refresh ChromaDB connection',
        details: error.message
      });
    }
  }
);

// GET /api/semantic/migration-status - Get migration status and recommendations
router.get('/migration-status',
  async (req: express.Request, res: express.Response) => {
    try {
      const response = {
        success: true,
        data: {
          status: 'ChromaDB Active',
          message: 'Using ChromaDB as primary vector database',
          migrationNeeded: false
        }
      };

      res.json(response);

    } catch (error: any) {
      console.error('Migration status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get migration status',
        details: error.message
      });
    }
  }
);

// POST /api/semantic/migrate-to-chromadb - Migrate data from Simple Vector DB to ChromaDB
router.post('/migrate-to-chromadb',
  [
    body('userId').optional().isString().withMessage('User ID must be a string'),
    body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean'),
    body('batchSize').optional().isInt({ min: 1, max: 200 }).withMessage('Batch size must be between 1 and 200'),
    body('clearTarget').optional().isBoolean().withMessage('Clear target must be boolean'),
    body('validateAfterMigration').optional().isBoolean().withMessage('Validate after migration must be boolean')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const response = {
        success: true,
        message: 'ChromaDB is already active - no migration needed',
        data: {
          status: 'already_using_chromadb',
          message: 'System is already configured to use ChromaDB'
        }
      };

      res.json(response);

    } catch (error: any) {
      console.error('Migration error:', error);
      res.status(500).json({
        success: false,
        error: 'Migration Failed',
        message: error.message
      });
    }
  }
);

// POST /api/semantic/synchronize-data - Synchronize data between vector databases
router.post('/synchronize-data',
  [
    body('userId').optional().isString().withMessage('User ID must be a string'),
    body('dryRun').optional().isBoolean().withMessage('Dry run must be boolean')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const response = {
        success: true,
        message: 'ChromaDB is the active vector database - no synchronization needed',
        data: {
          status: 'chromadb_active',
          message: 'All data is already in ChromaDB'
        }
      };

      res.json(response);

    } catch (error: any) {
      console.error('Synchronization error:', error);
      res.status(500).json({
        success: false,
        error: 'Synchronization Failed',
        message: error.message
      });
    }
  }
);

export default router;
