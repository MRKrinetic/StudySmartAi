import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Task } from '../models/index';
import { TaskDocument } from '../models/Task';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// GET /api/tasks - Get all tasks for a user with filtering and sorting
router.get('/',
  [
    query('userId').notEmpty().withMessage('User ID is required'),
    query('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { 
        userId, 
        completed, 
        priority, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        search 
      } = req.query;

      // Build filter object
      const filter: any = { userId };
      
      if (completed !== undefined) {
        filter.completed = completed === 'true';
      }
      
      if (priority) {
        filter.priority = priority;
      }

      // Build search query
      let query = Task.find(filter);

      if (search) {
        query = query.find({
          $text: { $search: search as string }
        });
      }

      // Apply sorting
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [sortBy as string]: sortDirection });

      const tasks = await query.exec();

      res.json({
        success: true,
        data: tasks,
        count: tasks.length
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch tasks'
      });
    }
  }
);

// GET /api/tasks/:id - Get a specific task
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    query('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      const task = await Task.findOne({ _id: id, userId });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch task'
      });
    }
  }
);

// POST /api/tasks - Create a new task
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Task title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description').optional().trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { title, description, priority = 'medium', dueDate, userId } = req.body;

      const taskData: any = {
        title,
        userId,
        priority
      };

      if (description) taskData.description = description;
      if (dueDate) taskData.dueDate = new Date(dueDate);

      const task = new Task(taskData);
      await task.save();

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create task'
      });
    }
  }
);

// PUT /api/tasks/:id - Update a task
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description').optional().trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { userId, ...updateData } = req.body;

      // Convert dueDate string to Date object if provided
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      const task = await Task.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update task'
      });
    }
  }
);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    query('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      const task = await Task.findOneAndDelete({ _id: id, userId });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete task'
      });
    }
  }
);

// GET /api/tasks/stats/:userId - Get task statistics for a user
router.get('/stats/:userId',
  [
    param('userId').notEmpty().withMessage('User ID is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;

      const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
        Task.countDocuments({ userId }),
        Task.countDocuments({ userId, completed: true }),
        Task.countDocuments({ userId, completed: false }),
        Task.countDocuments({ 
          userId, 
          completed: false, 
          dueDate: { $lt: new Date() } 
        })
      ]);

      const priorityStats = await Task.aggregate([
        { $match: { userId, completed: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      const stats = {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        byPriority: priorityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, { low: 0, medium: 0, high: 0 })
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch task statistics'
      });
    }
  }
);

export default router;
