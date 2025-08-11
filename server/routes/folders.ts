import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Folder, File, Notebook } from '../models/index';
import { ApiResponse } from '../../src/types/index';

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

// GET /api/folders/:notebookId - Get all folders for a notebook
router.get('/:notebookId',
  [param('notebookId').isMongoId().withMessage('Invalid notebook ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { notebookId } = req.params;

      // Verify notebook exists
      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      const folders = await Folder.find({ notebookId }).sort({ name: 1 });

      const response: ApiResponse<any[]> = {
        success: true,
        data: folders.map(folder => folder.toJSON())
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching folders:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch folders'
      });
    }
  }
);

// POST /api/folders - Create a new folder
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Folder name must be between 1 and 100 characters'),
    body('notebookId')
      .isMongoId()
      .withMessage('Invalid notebook ID'),
    body('parentFolderId')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent folder ID')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { name, notebookId, parentFolderId } = req.body;

      // Verify notebook exists
      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      // Verify parent folder exists if provided
      if (parentFolderId) {
        const parentFolder = await Folder.findById(parentFolderId);
        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'Parent folder not found'
          });
        }
      }

      const folder = new Folder({
        name,
        notebookId,
        parentFolderId: parentFolderId || null,
        isExpanded: false
      });

      await folder.save();

      const response: ApiResponse<any> = {
        success: true,
        data: folder.toJSON(),
        message: 'Folder created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating folder:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A folder with this name already exists in this location'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create folder'
      });
    }
  }
);

// PUT /api/folders/:id - Update a folder
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid folder ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Folder name must be between 1 and 100 characters'),
    body('isExpanded')
      .optional()
      .isBoolean()
      .withMessage('isExpanded must be a boolean')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const folder = await Folder.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!folder) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Folder not found'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: folder.toJSON(),
        message: 'Folder updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating folder:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A folder with this name already exists in this location'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update folder'
      });
    }
  }
);

// DELETE /api/folders/:id - Delete a folder and all its contents
router.delete('/:id',
  [param('id').isMongoId().withMessage('Invalid folder ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const folder = await Folder.findById(id);
      if (!folder) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Folder not found'
        });
      }

      // Delete all files in this folder
      await File.deleteMany({ folderId: id });

      // Delete all subfolders (recursive)
      const subfolders = await Folder.find({ parentFolderId: id });
      for (const subfolder of subfolders) {
        // This will recursively delete all nested folders and files
        await File.deleteMany({ folderId: subfolder._id });
        await Folder.deleteMany({ parentFolderId: subfolder._id });
      }
      await Folder.deleteMany({ parentFolderId: id });

      // Delete the folder itself
      await Folder.findByIdAndDelete(id);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Folder and all its contents deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete folder'
      });
    }
  }
);

export default router;
