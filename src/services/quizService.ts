import { 
  QuizGenerationRequest, 
  QuizGenerationResponse, 
  Quiz, 
  QuizSession, 
  QuizResult,
  ApiResponse 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class QuizService {
  private static instance: QuizService;
  private userId: string = 'default-user'; // In a real app, this would come from auth

  static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
    }
    return QuizService.instance;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Quiz API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Generate a new quiz based on ChromaDB content
   */
  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    try {
      console.log('🧠 QuizService: Generating quiz with request:', request);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/quiz/generate`);

      const response = await this.makeRequest<{ quiz: Quiz; session: QuizSession }>('/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log('📡 QuizService: API response:', response);

      if (response.success && response.data) {
        console.log('✅ QuizService: Quiz generated successfully:', response.data.quiz.title);
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log('❌ QuizService: Quiz generation failed:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to generate quiz'
        };
      }
    } catch (error) {
      console.error('💥 QuizService: Error generating quiz:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate quiz'
      };
    }
  }

  /**
   * Get quiz details by ID
   */
  async getQuiz(quizId: string): Promise<ApiResponse<Quiz>> {
    return this.makeRequest<Quiz>(`/${quizId}`);
  }

  /**
   * Get quiz session details
   */
  async getQuizSession(sessionId: string): Promise<ApiResponse<QuizSession>> {
    return this.makeRequest<QuizSession>(`/session/${sessionId}`);
  }

  /**
   * Submit an answer for a quiz question
   */
  async submitAnswer(
    sessionId: string, 
    questionId: string, 
    userAnswer: string | number, 
    timeSpent: number
  ): Promise<ApiResponse<{
    isCorrect: boolean;
    correctAnswer: string | number;
    explanation?: string;
    currentScore: number;
    questionsAnswered: number;
  }>> {
    return this.makeRequest(`/session/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({
        questionId,
        userAnswer,
        timeSpent
      }),
    });
  }

  /**
   * Complete a quiz session
   */
  async completeQuiz(sessionId: string): Promise<ApiResponse<QuizResult>> {
    return this.makeRequest<QuizResult>(`/session/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  /**
   * Get user's quiz history
   */
  async getQuizHistory(
    page: number = 1, 
    limit: number = 10, 
    status?: 'in_progress' | 'completed' | 'abandoned'
  ): Promise<ApiResponse<{
    sessions: QuizSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return this.makeRequest<{
      sessions: QuizSession[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/user/history?${params.toString()}`);
  }

  /**
   * Get quiz statistics for the user
   */
  async getQuizStatistics(): Promise<ApiResponse<{
    totalQuizzes: number;
    totalQuestions: number;
    correctAnswers: number;
    averageScore: number;
    recentActivity: any[];
  }>> {
    // This would be implemented when we add statistics endpoints
    return Promise.resolve({
      success: true,
      data: {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        recentActivity: []
      }
    });
  }

  /**
   * Set user ID for API requests
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    return this.userId;
  }
}

// Export singleton instance
export const quizService = QuizService.getInstance();

// Export class for testing
export default QuizService;
