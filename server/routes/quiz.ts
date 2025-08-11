import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Quiz, QuizSession } from '../models';
import quizGenerationService from '../services/quizGenerationService';
import { QuizGenerationRequest, QuizAnswer } from '../../src/types';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/quiz/generate
 * Generate a new quiz based on ChromaDB content
 */
router.post('/generate', [
  body('sourceType').isIn(['chromadb', 'files', 'content']).withMessage('Invalid source type'),
  body('questionCount').isInt({ min: 1, max: 50 }).withMessage('Question count must be between 1 and 50'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'mixed']).withMessage('Invalid difficulty level'),
  body('questionTypes').isArray({ min: 1 }).withMessage('At least one question type is required'),
  body('questionTypes.*').isIn(['multiple_choice', 'true_false', 'fill_in_blank']).withMessage('Invalid question type'),
  body('category').isLength({ min: 1, max: 100 }).withMessage('Category is required and must be under 100 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('timeLimit').optional().isInt({ min: 1, max: 300 }).withMessage('Time limit must be between 1 and 300 minutes'),
  body('focusTopics').optional().isArray().withMessage('Focus topics must be an array')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'default-user';
    const request: QuizGenerationRequest = req.body;

    const result = await quizGenerationService.generateQuiz(request, userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in quiz generation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during quiz generation'
    });
  }
});

/**
 * GET /api/quiz/:quizId
 * Get quiz details by ID
 */
router.get('/:quizId', [
  param('quizId').isMongoId().withMessage('Invalid quiz ID')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { quizId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'default-user';

    const quiz = await Quiz.findOne({ 
      _id: quizId, 
      $or: [{ userId }, { isPublic: true }] 
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz'
    });
  }
});

/**
 * GET /api/quiz/session/:sessionId
 * Get quiz session details
 */
router.get('/session/:sessionId', [
  param('sessionId').isMongoId().withMessage('Invalid session ID')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'default-user';

    const session = await QuizSession.findOne({ 
      _id: sessionId, 
      userId 
    }).populate('quizId');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Quiz session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching quiz session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz session'
    });
  }
});

/**
 * POST /api/quiz/session/:sessionId/answer
 * Submit an answer for a quiz question
 */
router.post('/session/:sessionId/answer', [
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('questionId').isString().withMessage('Question ID is required'),
  body('userAnswer').exists().withMessage('User answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, userAnswer, timeSpent } = req.body;
    const userId = req.headers['x-user-id'] as string || 'default-user';

    const session = await QuizSession.findOne({ 
      _id: sessionId, 
      userId,
      status: 'in_progress'
    }).populate('quizId');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Active quiz session not found'
      });
    }

    const quiz = session.quizId as any;
    const question = quiz.questions.find((q: any) => q.id === questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found in quiz'
      });
    }

    // Check if question already answered
    const existingAnswer = session.answers.find(a => a.questionId === questionId);
    if (existingAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Question already answered'
      });
    }

    // Determine if answer is correct
    let isCorrect = false;
    if (question.type === 'multiple_choice') {
      isCorrect = parseInt(userAnswer) === question.correctAnswer;
    } else if (question.type === 'true_false') {
      isCorrect = String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
    } else if (question.type === 'fill_in_blank') {
      isCorrect = String(userAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
    }

    // Add answer to session
    const answer: QuizAnswer = {
      questionId,
      userAnswer,
      isCorrect,
      timeSpent,
      answeredAt: new Date()
    };

    session.addAnswer(answer);
    await session.save();

    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        currentScore: session.score,
        questionsAnswered: session.questionsAnswered
      }
    });
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

/**
 * POST /api/quiz/session/:sessionId/complete
 * Complete a quiz session
 */
router.post('/session/:sessionId/complete', [
  param('sessionId').isMongoId().withMessage('Invalid session ID')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'default-user';

    const session = await QuizSession.findOne({ 
      _id: sessionId, 
      userId,
      status: 'in_progress'
    }).populate('quizId');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Active quiz session not found'
      });
    }

    session.complete();
    await session.save();

    const quiz = session.quizId as any;
    const passed = session.percentage! >= quiz.passingScore;

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        score: session.score,
        totalQuestions: quiz.questions.length,
        percentage: session.percentage,
        timeSpent: session.timeSpent,
        passed,
        passingScore: quiz.passingScore,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    console.error('Error completing quiz session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete quiz session'
    });
  }
});

/**
 * GET /api/quiz/user/history
 * Get user's quiz history
 */
router.get('/user/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['in_progress', 'completed', 'abandoned']).withMessage('Invalid status')
], handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'default-user';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    const sessions = await QuizSession.find(filter)
      .populate('quizId', 'title category difficulty')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await QuizSession.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz history'
    });
  }
});

export default router;
