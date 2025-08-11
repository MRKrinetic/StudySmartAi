import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { File, Folder, Notebook } from '../models/index';
import { ApiResponse } from '../../src/types/index';
import { FileProcessingService } from '../services/fileProcessingService';

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

// GET /api/files/single/:id - Get a single file by ID
router.get('/single/:id',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const file = await File.findById(id);
      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'File not found'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: file.toJSON()
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching file:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch file'
      });
    }
  }
);

// GET /api/files/notebook/:notebookId - Get all files for a notebook
router.get('/notebook/:notebookId',
  [
    param('notebookId').isMongoId().withMessage('Invalid notebook ID'),
    query('folderId').optional().isMongoId().withMessage('Invalid folder ID')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { notebookId } = req.params;
      const { folderId } = req.query;

      // Verify notebook exists
      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      // Build query
      const query: any = { notebookId };
      if (folderId) {
        query.folderId = folderId;
      } else {
        query.folderId = null; // Root level files
      }

      const files = await File.find(query).sort({ name: 1 });

      const response: ApiResponse<any[]> = {
        success: true,
        data: files.map(file => file.toJSON())
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch files'
      });
    }
  }
);

// POST /api/files - Create a new file
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),
    body('type')
      .isIn(['txt', 'md', 'py', 'js', 'cpp', 'json', 'csv'])
      .withMessage('File type must be one of: txt, md, py, js, cpp, json, csv'),
    body('notebookId')
      .isMongoId()
      .withMessage('Invalid notebook ID'),
    // Custom validation for folderId that handles undefined/null properly
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { folderId } = req.body;
      console.log('Custom validation - folderId:', folderId, 'type:', typeof folderId);

      // If folderId is not provided, undefined, null, or empty string, it's valid (root level file)
      if (folderId === undefined || folderId === null || folderId === '') {
        return next();
      }

      // If folderId is provided, it must be a valid MongoDB ObjectId
      if (typeof folderId === 'string' && /^[0-9a-fA-F]{24}$/.test(folderId)) {
        return next();
      }

      // Invalid folderId format
      console.log('Custom validation failed for folderId:', folderId);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid folder ID format'
      });
    }
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('Backend - Received request body:', req.body);
      console.log('Backend - folderId details:', {
        value: req.body.folderId,
        type: typeof req.body.folderId,
        isUndefined: req.body.folderId === undefined,
        isNull: req.body.folderId === null,
        isEmpty: req.body.folderId === '',
        hasProperty: req.body.hasOwnProperty('folderId')
      });

      const { name, content = '', type, notebookId, folderId } = req.body;

      // Verify notebook exists
      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      // Verify folder exists if provided
      if (folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'Folder not found'
          });
        }
      }

      const file = new File({
        name,
        content,
        type,
        notebookId,
        folderId: folderId || null
      });

      await file.save();

      const response: ApiResponse<any> = {
        success: true,
        data: file.toJSON(),
        message: 'File created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating file:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A file with this name already exists in this location'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create file'
      });
    }
  }
);

// PUT /api/files/:id - Update a file
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid file ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),
    body('type')
      .optional()
      .isIn(['txt', 'md', 'py', 'js', 'cpp', 'json', 'csv'])
      .withMessage('File type must be one of: txt, md, py, js, cpp, json, csv')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const file = await File.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'File not found'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: file.toJSON(),
        message: 'File updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating file:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A file with this name already exists in this location'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update file'
      });
    }
  }
);

// DELETE /api/files/:id - Delete a file
router.delete('/:id',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const file = await File.findByIdAndDelete(id);
      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'File not found'
        });
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'File deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete file'
      });
    }
  }
);

// GET /api/files/:id/content - Get file content for execution
router.get('/:id/content',
  [param('id').isMongoId().withMessage('Invalid file ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const file = await File.findById(id);
      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'File not found'
        });
      }

      // Return file content in a format suitable for code execution
      const response: ApiResponse<{
        id: string;
        name: string;
        type: string;
        content: string;
        size: number;
      }> = {
        success: true,
        data: {
          id: file._id.toString(),
          name: file.name,
          type: file.type,
          content: file.content,
          size: file.content.length
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch file content'
      });
    }
  }
);

export default router;
