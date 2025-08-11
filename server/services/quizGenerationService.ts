import { GoogleGenerativeAI } from '@google/generative-ai';
import { VectorDbService } from './vectorDbService';
import { Quiz, QuizSession } from '../models';
import {
  QuizGenerationRequest,
  QuizGenerationResponse,
  IQuizQuestion,
  IQuiz
} from '../../src/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
console.log('🔑 Gemini API Key configured:', !!apiKey);
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not configured. Quiz generation will not work.');
} else {
  console.log('✅ Gemini API Key found, length:', apiKey.length);
}

const genAI = new GoogleGenerativeAI(apiKey || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class QuizGenerationService {
  private vectorDbService: VectorDbService;

  constructor() {
    this.vectorDbService = new VectorDbService();
  }

  /**
   * Generate a quiz based on the request parameters
   */
  async generateQuiz(request: QuizGenerationRequest, userId: string): Promise<QuizGenerationResponse> {
    try {
      console.log(`🧠 Generating quiz for user ${userId}:`, {
        sourceType: request.sourceType,
        questionCount: request.questionCount,
        difficulty: request.difficulty,
        questionTypes: request.questionTypes
      });

      // Get relevant content from ChromaDB
      const contextContent = await this.getRelevantContent(request, userId);
      
      if (!contextContent || contextContent.length === 0) {
        return {
          success: false,
          error: 'No relevant content found for quiz generation. Please upload some files first.'
        };
      }

      // Generate quiz questions using Gemini AI
      const questions = await this.generateQuestions(request, contextContent);
      
      if (!questions || questions.length === 0) {
        return {
          success: false,
          error: 'Failed to generate quiz questions. Please try again.'
        };
      }

      // Create quiz object
      const quiz = await this.createQuiz(request, questions, userId, contextContent);
      
      // Create initial quiz session
      const session = await this.createQuizSession(quiz._id.toString(), userId);

      return {
        success: true,
        data: {
          quiz: quiz.toObject(),
          session: session.toObject()
        }
      };

    } catch (error) {
      console.error('Error generating quiz:', error);
      return {
        success: false,
        error: 'Failed to generate quiz. Please try again later.'
      };
    }
  }

  /**
   * Get relevant content from ChromaDB based on request
   */
  private async getRelevantContent(request: QuizGenerationRequest, userId: string): Promise<any[]> {
    try {
      await this.vectorDbService.initialize();

      let searchQuery = '';
      
      // Build search query based on focus topics or general content
      if (request.focusTopics && request.focusTopics.length > 0) {
        searchQuery = request.focusTopics.join(' ');
      } else {
        // Use category and tags to build a general search query
        searchQuery = `${request.category} ${request.tags?.join(' ') || ''}`.trim();
      }

      // If no specific query, get a broad sample of content
      if (!searchQuery) {
        searchQuery = 'programming code development software';
      }

      const searchResults = await this.vectorDbService.searchSimilar({
        queryText: searchQuery,
        userId,
        nResults: Math.min(request.questionCount * 2, 20), // Get more content than questions needed
        threshold: 0.0, // Very low threshold to get any content for testing
        fileTypes: request.sourceFiles ? undefined : ['txt', 'md', 'py', 'js', 'cpp', 'json']
      });

      console.log(`📚 Retrieved ${searchResults.length} content pieces for quiz generation`);
      return searchResults;

    } catch (error) {
      console.error('Error retrieving content from ChromaDB:', error);
      return [];
    }
  }

  /**
   * Generate quiz questions using Gemini AI
   */
  private async generateQuestions(
    request: QuizGenerationRequest, 
    contextContent: any[]
  ): Promise<IQuizQuestion[]> {
    try {
      const contentText = contextContent
        .map(item => `File: ${item.metadata.filePath}\nContent: ${item.document}`)
        .join('\n\n---\n\n');

      const questionTypesStr = request.questionTypes.join(', ');
      const difficultyStr = request.difficulty === 'mixed' 
        ? 'varied difficulty levels (easy, medium, hard)' 
        : request.difficulty;

      const prompt = `You are an expert quiz generator. Create ${request.questionCount} quiz questions based on the following content.

CONTENT TO USE:
${contentText}

REQUIREMENTS:
- Question types: ${questionTypesStr}
- Difficulty: ${difficultyStr}
- Category: ${request.category}
- Make questions contextual to the provided content
- Ensure questions test understanding, not just memorization
- Include explanations for correct answers

QUESTION TYPES GUIDE:
- multiple_choice: 4 options (A, B, C, D), return option index (0-3) as correctAnswer
- true_false: True/False question, return "true" or "false" as correctAnswer
- fill_in_blank: Question with blank to fill, return exact text as correctAnswer

Return ONLY a valid JSON array of questions in this exact format:
[
  {
    "id": "unique_id",
    "type": "multiple_choice|true_false|fill_in_blank",
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
    "correctAnswer": 0, // Index for multiple_choice, "true"/"false" for true_false, text for fill_in_blank
    "explanation": "Why this answer is correct",
    "difficulty": "easy|medium|hard",
    "sourceContent": "Brief excerpt from source",
    "sourceFile": "filename",
    "tags": ["tag1", "tag2"],
    "points": 10
  }
]

Generate diverse, high-quality questions that test real understanding of the content.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanedText);

      // Validate and process questions
      return this.validateAndProcessQuestions(questions, request);

    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  /**
   * Validate and process generated questions
   */
  private validateAndProcessQuestions(
    questions: any[], 
    request: QuizGenerationRequest
  ): IQuizQuestion[] {
    const validQuestions: IQuizQuestion[] = [];

    for (const q of questions) {
      try {
        // Ensure required fields
        if (!q.question || !q.type || q.correctAnswer === undefined) {
          continue;
        }

        // Validate question type
        if (!['multiple_choice', 'true_false', 'fill_in_blank'].includes(q.type)) {
          continue;
        }

        // Validate multiple choice questions
        if (q.type === 'multiple_choice') {
          if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
            continue;
          }
          if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
            continue;
          }
        }

        // Validate true/false questions
        if (q.type === 'true_false') {
          if (!['true', 'false'].includes(String(q.correctAnswer).toLowerCase())) {
            continue;
          }
          q.correctAnswer = String(q.correctAnswer).toLowerCase();
        }

        // Set defaults and clean up
        const question: IQuizQuestion = {
          id: q.id || uuidv4(),
          type: q.type,
          question: q.question.trim(),
          options: q.options || undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation?.trim() || '',
          difficulty: q.difficulty || request.difficulty === 'mixed' ? 'medium' : request.difficulty,
          sourceContent: q.sourceContent?.trim() || '',
          sourceFile: q.sourceFile?.trim() || '',
          tags: Array.isArray(q.tags) ? q.tags : (request.tags || []),
          points: typeof q.points === 'number' ? Math.max(1, Math.min(100, q.points)) : 10
        };

        validQuestions.push(question);

      } catch (error) {
        console.error('Error validating question:', error);
        continue;
      }
    }

    console.log(`✅ Validated ${validQuestions.length} out of ${questions.length} generated questions`);
    return validQuestions.slice(0, request.questionCount);
  }

  /**
   * Create quiz in database
   */
  private async createQuiz(
    request: QuizGenerationRequest,
    questions: IQuizQuestion[],
    userId: string,
    contextContent: any[]
  ): Promise<IQuiz> {
    const sourceFiles = contextContent.map(item => item.metadata.filePath);
    
    const quiz = new Quiz({
      title: `${request.category} Quiz`,
      description: `Auto-generated quiz with ${questions.length} questions`,
      questions,
      difficulty: request.difficulty,
      category: request.category,
      tags: request.tags || [],
      timeLimit: request.timeLimit,
      passingScore: 70,
      sourceFiles,
      userId,
      isPublic: false
    });

    return await quiz.save();
  }

  /**
   * Create initial quiz session
   */
  private async createQuizSession(quizId: string, userId: string): Promise<any> {
    const session = new QuizSession({
      quizId,
      userId,
      startedAt: new Date(),
      currentQuestionIndex: 0,
      answers: [],
      timeSpent: 0,
      status: 'in_progress'
    });

    return await session.save();
  }
}

export default new QuizGenerationService();
