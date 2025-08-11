import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Notebook, Folder, File } from '../models/index';
import { ApiResponse, NotebookTreeData } from '../../src/types/index';

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

// GET /api/notebooks - Get all notebooks with their folder/file structure
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const notebooks = await Notebook.find().sort({ createdAt: -1 });
    
    const notebookTreeData: NotebookTreeData = {
      notebooks: []
    };

    for (const notebook of notebooks) {
      // Get folders for this notebook
      const folders = await Folder.find({ notebookId: notebook._id }).sort({ name: 1 });
      
      // Get files for this notebook
      const files = await File.find({ notebookId: notebook._id }).sort({ name: 1 });
      
      // Build the tree structure
      const sections = folders.map(folder => ({
        id: folder._id.toString(),
        name: folder.name,
        isExpanded: folder.isExpanded || false,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        files: files
          .filter(file => file.folderId?.toString() === folder._id.toString())
          .map(file => ({
            id: file._id.toString(),
            name: file.name,
            type: file.type,
            content: file.content,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
          }))
      }));

      // Add files that don't belong to any folder (root level files)
      const rootFiles = files
        .filter(file => !file.folderId)
        .map(file => ({
          id: file._id.toString(),
          name: file.name,
          type: file.type,
          content: file.content,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }));

      // If there are root files, create a default section for them
      if (rootFiles.length > 0) {
        sections.unshift({
          id: 'root',
          name: 'Files',
          isExpanded: true,
          files: rootFiles
        });
      }

      notebookTreeData.notebooks.push({
        id: notebook._id.toString(),
        name: notebook.name,
        description: notebook.description,
        isExpanded: notebook.isExpanded || false,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        sections
      });
    }

    const response: ApiResponse<NotebookTreeData> = {
      success: true,
      data: notebookTreeData
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch notebooks'
    });
  }
});

// POST /api/notebooks - Create a new notebook
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Notebook name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { name, description } = req.body;

      const notebook = new Notebook({
        name,
        description,
        isExpanded: true
      });

      await notebook.save();

      const response: ApiResponse<any> = {
        success: true,
        data: notebook.toJSON(),
        message: 'Notebook created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating notebook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create notebook'
      });
    }
  }
);

// PUT /api/notebooks/:id - Update a notebook
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid notebook ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Notebook name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
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

      const notebook = await Notebook.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: notebook.toJSON(),
        message: 'Notebook updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating notebook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update notebook'
      });
    }
  }
);

// DELETE /api/notebooks/:id - Delete a notebook and all its contents
router.delete('/:id',
  [param('id').isMongoId().withMessage('Invalid notebook ID')],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;

      const notebook = await Notebook.findById(id);
      if (!notebook) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Notebook not found'
        });
      }

      // Delete all files in this notebook
      await File.deleteMany({ notebookId: id });

      // Delete all folders in this notebook
      await Folder.deleteMany({ notebookId: id });

      // Delete the notebook
      await Notebook.findByIdAndDelete(id);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Notebook and all its contents deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting notebook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete notebook'
      });
    }
  }
);

export default router;
