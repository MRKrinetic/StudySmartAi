import express from 'express';
import { validationResult } from 'express-validator';
import { File, Notebook } from '../models/index';
import { FileIndexResponse, IndexedFile, IndexCacheData } from '../../src/types/index';
import fs from 'fs';
import path from 'path';
import {
  generateBatchEmbeddings,
  prepareContentForEmbedding,
  FileEmbeddingData
} from '../services/embeddingService';
import { vectorDbService, VectorDocument } from '../services/vectorDbService';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.array().map(err => err.msg).join(', ')
    });
  }
  next();
};

// Helper function to get file extension from filename
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
};

// Helper function to truncate content for preview
const createPreview = (content: string, maxLength: number = 2000): string => {
  if (!content || content.length <= maxLength) {
    return content || '';
  }
  return content.substring(0, maxLength) + '...';
};

// Helper function to write cache file
const writeCacheFile = async (cacheData: IndexCacheData): Promise<void> => {
  try {
    const cacheFilePath = path.join(process.cwd(), '.context-cache-global.json');
    await fs.promises.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`📝 Cache file updated: ${cacheFilePath}`);
  } catch (error) {
    console.error('❌ Error writing cache file:', error);
    throw new Error('Failed to write cache file');
  }
};

// GET /api/index/all-files - Get all files with metadata for AI indexing
router.get('/all-files',
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('🔍 Fetching all files for indexing...');

      // Fetch all files with populated notebook information
      const files = await File.find({})
        .populate('notebookId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📁 Found ${files.length} files`);

      // Transform files into indexed format
      const indexedFiles: IndexedFile[] = files.map(file => {
        const notebookName = (file.notebookId as any)?.name || 'Unknown Notebook';
        const extension = getFileExtension(file.name);
        
        return {
          notebook: notebookName,
          filename: file.name,
          extension: extension,
          preview: createPreview(file.content),
          fileId: file._id.toString(),
          createdAt: file.createdAt.toISOString()
        };
      });

      // Create cache data
      const cacheData: IndexCacheData = {
        files: indexedFiles,
        lastUpdated: new Date().toISOString(),
        totalFiles: indexedFiles.length
      };

      // Write cache file for AI context
      await writeCacheFile(cacheData);

      // Prepare response
      const response: FileIndexResponse = {
        success: true,
        data: indexedFiles,
        totalFiles: indexedFiles.length,
        message: `Successfully indexed ${indexedFiles.length} files`
      };

      console.log(`✅ Successfully indexed ${indexedFiles.length} files`);
      res.json(response);

    } catch (error) {
      console.error('❌ Error fetching files for indexing:', error);
      
      const response: FileIndexResponse = {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch files for indexing'
      };

      res.status(500).json(response);
    }
  }
);

// GET /api/index/stats - Get indexing statistics
router.get('/stats',
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('📊 Fetching indexing statistics...');

      // Get file counts by type
      const fileStats = await File.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalSize: { $sum: '$size' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get notebook counts
      const notebookCount = await File.distinct('notebookId').then(ids => ids.length);
      const totalFiles = await File.countDocuments();

      // Check if cache file exists
      const cacheFilePath = path.join(process.cwd(), '.context-cache-global.json');
      let cacheInfo = null;
      
      try {
        const cacheStats = await fs.promises.stat(cacheFilePath);
        cacheInfo = {
          exists: true,
          lastModified: cacheStats.mtime.toISOString(),
          size: cacheStats.size
        };
      } catch {
        cacheInfo = { exists: false };
      }

      const response = {
        success: true,
        data: {
          totalFiles,
          notebookCount,
          filesByType: fileStats,
          cache: cacheInfo
        }
      };

      res.json(response);

    } catch (error) {
      console.error('❌ Error fetching indexing statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch indexing statistics'
      });
    }
  }
);

// POST /api/index/semantic-files - Index files with vector embeddings
router.post('/semantic-files',
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { incremental = false } = req.body;
      const userId = 'default'; // For now, using default user ID

      console.log(`🔄 Starting semantic file indexing (incremental: ${incremental})...`);

      // Fetch all files for indexing
      const files = await File.find({})
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

      // Prepare files for ChromaDB (local embedding generation)
      console.log(`📝 Preparing ${fileEmbeddingData.length} files for ChromaDB...`);

      // Prepare documents for ChromaDB (using local embeddings)
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

      // Store embeddings in ChromaDB
      if (vectorDocuments.length > 0) {
        console.log(`💾 Storing ${vectorDocuments.length} embeddings in ChromaDB...`);
        await vectorDbService.upsertDocuments(vectorDocuments);
      }

      const response = {
        success: true,
        message: `Successfully indexed ${indexedCount} files with semantic embeddings`,
        data: {
          totalFiles: files.length,
          indexedFiles: indexedCount,
          skippedFiles: files.length - indexedCount,
          errors,
          vectorDbStats: await vectorDbService.getCollectionStats()
        }
      };

      console.log(`✅ Semantic file indexing completed: ${indexedCount}/${files.length} files indexed`);
      res.json(response);

    } catch (error: any) {
      console.error('❌ Error during semantic file indexing:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to index files with semantic embeddings',
        details: error.message
      });
    }
  }
);

export default router;
